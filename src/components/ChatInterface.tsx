import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import { useEffect, useRef, useState } from "react";
import type {
  ChatRequestBody,
  DownloadLink,
  Message,
  StreamEventPayload,
} from "../types";
import ChatBubble from "./ChatBubble";
import ChatInput from "./ChatInput";
import { Badge } from "./ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { ScrollArea } from "./ui/scroll-area";
import { Sparkles } from "lucide-react";

type SummaryPayload = {
  created_files?: string[];
  master_summary_file?: string;
};

type HandlerContext = {
  setMessages: Dispatch<SetStateAction<Message[]>>;
  setIsStreaming: Dispatch<SetStateAction<boolean>>;
  eventSourceRef: MutableRefObject<EventSource | null>;
  buildDownloadLinks: (payload: SummaryPayload) => DownloadLink[];
  rawEvent: string;
};

type Handler = (parsed: unknown, raw: string, helpers: HandlerContext) => void;

const apiBase = (() => {
  const env = (import.meta.env.VITE_API_URL as string | undefined) ?? "";
  return env.replace(/\/$/, "") || "http://10.112.30.10:8000";
})();

const buildApiUrl = (path: string): string =>
  `${apiBase}${path.startsWith("/") ? path : `/${path}`}`;

const buildDownloadUrl = (filename: string): string =>
  new URL(`/download/?filename=${encodeURIComponent(filename)}`, apiBase).toString();

function parseEventMessage(raw: string): StreamEventPayload {
  const result: StreamEventPayload = { event: "", data: "" };
  raw
    .trim()
    .split(/\r?\n/)
    .forEach((line) => {
      const [prefix, ...rest] = line.split(": ");
      const value = rest.join(": ");
      if (prefix === "event") result.event = value;
      else if (prefix === "data") result.data += value;
    });
  return result;
}

function buildDownloadLinks(payload: SummaryPayload): DownloadLink[] {
  const links: DownloadLink[] = [];

  if (Array.isArray(payload.created_files)) {
    payload.created_files.forEach((fullPath) => {
      const name = fullPath.split(/[\\/]/).pop() || fullPath;
      links.push({
        name,
        url: buildDownloadUrl(name),
        type: "trace_analysis",
      });
    });
  }

  if (typeof payload.master_summary_file === "string") {
    const name =
      payload.master_summary_file.split(/[\\/]/).pop() ||
      payload.master_summary_file;
    links.push({
      name,
      url: buildDownloadUrl(name),
      type: "master_summary",
    });
  }

  return links;
}

const updateLastBotMessageWithLinks = (
  messages: Message[],
  newLinks: DownloadLink[],
): Message[] => {
  const copy = [...messages];
  for (let i = copy.length - 1; i >= 0; i -= 1) {
    if (copy[i].from === "bot") {
      const existingLinks = copy[i].downloadLinks || [];
      copy[i] = {
        ...copy[i],
        downloadLinks: [...existingLinks, ...newLinks],
      };
      break;
    }
  }
  return copy;
};

const createTextAppender =
  (templateFn: (parsed: unknown, raw: string) => string): Handler =>
  (parsed, raw, { setMessages }) => {
    const chunk = templateFn(parsed, raw) + "\n\n";
    setMessages((prev) => {
      const last = prev[prev.length - 1];
      if (last?.from === "bot" && !last.text.includes(chunk.trim())) {
        return [...prev.slice(0, -1), { ...last, text: last.text + chunk }];
      }
      return prev;
    });
  };

const defaultHandler: Handler = (parsed, raw, { setMessages, rawEvent }) => {
  const header = `${rawEvent}`;
  const body =
    typeof parsed === "object" ? JSON.stringify(parsed, null, 2) : String(parsed);
  const chunk = [header, body].join("\n") + "\n\n";

  setMessages((prev) => {
    const last = prev[prev.length - 1];
    if (last?.from === "bot" && !last.text.includes(chunk.trim())) {
      return [...prev.slice(0, -1), { ...last, text: last.text + chunk }];
    }
    return prev;
  });
};

const handlers: Record<string, Handler> = {
  "Extracted Parameters": createTextAppender((parsed) => {
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "parameters" in parsed
    ) {
      const parameters = (parsed as { parameters: Record<string, unknown> })
        .parameters;
      const timeFrame = String(
        (parameters as Record<string, unknown>).time_frame ?? "",
      );
      const domain = String(
        (parameters as Record<string, unknown>).domain ?? "",
      );
      const queryKeys = (parameters as Record<string, unknown>).query_keys as
        | string[]
        | string
        | undefined;
      const keywords = Array.isArray(queryKeys)
        ? queryKeys.join(", ")
        : queryKeys ?? "";
      return [
        "I have found the following parameters from your request",
        `Time Frame: ${timeFrame}`,
        `Domain: ${domain}`,
        `Keywords to search for: ${keywords}`,
      ].join("\n");
    }
    return String(parsed);
  }),

  "Downloaded logs in file": createTextAppender(() => "Downloaded logs"),

  "Found trace id(s)": createTextAppender((parsed) => {
    if (typeof parsed === "object" && parsed !== null && "count" in parsed) {
      return `Found ${(parsed as { count: number }).count} requests`;
    }
    return String(parsed);
  }),

  "Compiled Request Traces": createTextAppender(() => "Compiled Request Traces"),

  done: (parsed, raw, { setMessages, setIsStreaming, eventSourceRef }) => {
    setMessages((prev) => {
      const last = prev[prev.length - 1];
      if (last?.from === "bot" && !last.text.includes(raw)) {
        const finalText =
          typeof parsed === "object" && parsed !== null && "message" in parsed
            ? (parsed as { message?: string }).message ?? raw
            : raw;
        return [
          ...prev.slice(0, -1),
          { ...last, text: last.text + finalText + "\n\n" },
        ];
      }
      return prev;
    });

    setMessages((prev) =>
      prev.map((msg) =>
        msg.from === "bot" && msg.isStreaming
          ? { ...msg, isStreaming: false }
          : msg,
      ),
    );

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsStreaming(false);
  },

  "Compiled Summary": (parsed, _raw, { setMessages, buildDownloadLinks }) => {
    const links = buildDownloadLinks((parsed ?? {}) as SummaryPayload);
    setMessages((prev) => updateLastBotMessageWithLinks(prev, links));
  },

  "Verification Results": (parsed, raw, { setMessages }) => {
    const verificationText = typeof parsed === "string" ? parsed : raw;

    const summaryText = verificationText.split("Relevant files:")[0].trim();

    const relevantMatch = verificationText.match(/Relevant files:\s*\[(.*?)\]/);
    const lessRelevantMatch = verificationText.match(
      /Less Relevant Files:\s*\[(.*?)\]/,
    );
    const notRelevantMatch = verificationText.match(
      /Not Relevant Files:\s*\[(.*?)\]/,
    );

    const parseFiles = (match: RegExpMatchArray | null): string[] => {
      if (!match || !match[1] || match[1].trim() === "") return [];
      return match[1]
        .split(",")
        .map((f) => f.trim().replace(/['"]/g, ""))
        .filter((f) => f.length > 0);
    };

    const relevantFiles = parseFiles(relevantMatch);
    const lessRelevantFiles = parseFiles(lessRelevantMatch);
    const notRelevantFiles = parseFiles(notRelevantMatch);

    const allFiles: Array<{ name: string; type: DownloadLink["type"] }> = [
      ...relevantFiles.map((name) => ({ name, type: "relevant" })),
      ...lessRelevantFiles.map((name) => ({ name, type: "less_relevant" })),
      ...notRelevantFiles.map((name) => ({ name, type: "not_relevant" })),
    ];

    const downloadLinks: DownloadLink[] = allFiles.map(({ name, type }) => ({
      name,
      url: buildDownloadUrl(name),
      type,
    }));

    setMessages((prev) => {
      const last = prev[prev.length - 1];
      if (last?.from === "bot") {
        const updatedMessages = [
          ...prev.slice(0, -1),
          { ...last, text: last.text + summaryText + "\n\n" },
        ];
        return updateLastBotMessageWithLinks(updatedMessages, downloadLinks);
      }
      return prev;
    });
  },
};

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>("");
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesWrapperRef = useRef<HTMLDivElement | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const processedEventsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const container = messagesWrapperRef.current;
    if (!container) return;

    const behavior: ScrollBehavior = messages.length > 1 ? "smooth" : "auto";
    requestAnimationFrame(() => {
      container.scrollTo({
        top: container.scrollHeight,
        behavior,
      });
    });
  }, [messages]);

  const sendMessage = async (
    userMessage: string,
    project: string,
    env: string,
    domain: string,
  ) => {
    if (!userMessage.trim() || isStreaming) return;

    processedEventsRef.current.clear();

    setMessages((m) => [...m, { from: "user", text: userMessage }]);
    setInput("");
    setIsStreaming(true);

    try {
      const requestBody: ChatRequestBody = {
        prompt: userMessage,
        project,
        env,
        domain,
      };

      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }

      const response = await fetch(buildApiUrl("/api/chat"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const { streamUrl } = (await response.json()) as { streamUrl: string };

      setMessages((m) => [
        ...m,
        { from: "bot", text: "", isStreaming: true, downloadLinks: [] },
      ]);

      const eventSource = new EventSource(new URL(streamUrl, apiBase).toString());
      eventSourceRef.current = eventSource;

      eventSource.onerror = (e) => {
        console.error("SSE Error", e);
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
          eventSourceRef.current = null;
        }
        setIsStreaming(false);
        setMessages((m) =>
          m.map((msg) =>
            msg.isStreaming ? { ...msg, isStreaming: false } : msg,
          ),
        );
      };

      eventSource.onmessage = (e: MessageEvent<string>) => {
        const { event: rawEvent, data: rawData } = parseEventMessage(e.data);
        const eventKey = `${rawEvent}-${rawData}`;
        if (processedEventsRef.current.has(eventKey)) return;
        processedEventsRef.current.add(eventKey);

        let parsed: unknown;
        try {
          parsed = JSON.parse(rawData);
        } catch {
          parsed = rawData;
        }

        const handler = handlers[rawEvent] || defaultHandler;
        handler(parsed, rawData, {
          setMessages,
          setIsStreaming,
          eventSourceRef,
          buildDownloadLinks,
          rawEvent,
        });
      };

      eventSource.addEventListener("done", () => {
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
          eventSourceRef.current = null;
        }
        setIsStreaming(false);
        setMessages((m) =>
          m.map((msg) =>
            msg.isStreaming ? { ...msg, isStreaming: false } : msg,
          ),
        );
      });
    } catch (err) {
      console.error("SendMessage Error", err);
      setIsStreaming(false);
      setMessages((m) => {
        const copy = [...m];
        if (
          copy.length &&
          copy[copy.length - 1].from === "bot" &&
          copy[copy.length - 1].isStreaming
        ) {
          copy.pop();
        }
        return copy;
      });
    }
  };

  return (
    <Card className="overflow-hidden border-border/70 bg-card/80 shadow-2xl">
      <CardHeader className="border-b border-border/60 bg-gradient-to-r from-primary/5 via-accent/5 to-transparent">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <Sparkles className="h-5 w-5" />
            </span>
            <div className="space-y-1">
              <CardTitle className="text-xl">Conversation</CardTitle>
              <CardDescription>
                Send a prompt and stream structured responses in real time.
              </CardDescription>
            </div>
          </div>
          <Badge
            variant={isStreaming ? "info" : "muted"}
            className="flex items-center gap-2 text-xs"
          >
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                isStreaming ? "bg-accent animate-pulse" : "bg-muted-foreground/50"
              }`}
            />
            {isStreaming ? "Streaming" : "Idle"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="px-6 py-6">
          <ScrollArea
            viewportRef={messagesWrapperRef}
            className="h-[58vh] w-full rounded-2xl border border-border/60 bg-background/50 shadow-inner"
          >
            <div className="flex min-h-[50vh] flex-col gap-4 p-4">
              {messages.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
                  <Badge variant="muted" className="px-3 py-1 text-xs uppercase">
                    Loggy is ready
                  </Badge>
                  <div className="space-y-1">
                    <p className="text-lg font-semibold text-foreground">
                      How can I help you check logs today?
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Ask about traces, summaries, or IDs you want to explore.
                    </p>
                  </div>
                </div>
              ) : (
                messages.map((message, index) => (
                  <ChatBubble
                    key={`${message.from}-${index}-${message.text.length}`}
                    message={message}
                    index={index}
                    downloadLinks={message.downloadLinks || []}
                  />
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </CardContent>

      <CardFooter className="border-t border-border/60 bg-background/60 p-4">
        <ChatInput
          input={input}
          setInput={setInput}
          onSend={sendMessage}
          isStreaming={isStreaming}
        />
      </CardFooter>
    </Card>
  );
}
