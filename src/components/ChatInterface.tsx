import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import type {
  ChatRequestBody,
  DownloadLink,
  FileViewerState,
  Message,
  StreamEventPayload,
} from "../types";
import ChatBubble from "./ChatBubble";
import ChatInput from "./ChatInput";
import { Badge } from "./ui/badge";
import { FileViewerModal } from "./file-viewer";
import { parseSummaryContent } from "../lib/parseSummaryContent";

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
  const [fileViewer, setFileViewer] = useState<FileViewerState>({
    isOpen: false,
    isLoading: false,
    error: null,
    filename: null,
    fileType: null,
    content: null,
    parsedContent: null,
    downloadUrl: null,
  });
  const messagesWrapperRef = useRef<HTMLDivElement | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const processedEventsRef = useRef<Set<string>>(new Set());
  const fileViewerAbortRef = useRef<AbortController | null>(null);

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

  const openFileViewer = useCallback(async (link: DownloadLink) => {
    // Cancel any existing fetch
    if (fileViewerAbortRef.current) {
      fileViewerAbortRef.current.abort();
    }

    const controller = new AbortController();
    fileViewerAbortRef.current = controller;

    const downloadUrl = link.url;

    setFileViewer({
      isOpen: true,
      isLoading: true,
      error: null,
      filename: link.name,
      fileType: link.type,
      content: null,
      parsedContent: null,
      downloadUrl,
    });

    try {
      const contentUrl = new URL("/content/", apiBase);
      contentUrl.searchParams.set("filename", link.name);

      const response = await fetch(contentUrl.toString(), {
        headers: { accept: "application/json" },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Handle JSON response
      const contentType = response.headers.get("content-type");
      let content: string;

      if (contentType?.includes("application/json")) {
        const json = await response.json();
        content = json.content || JSON.stringify(json, null, 2);
      } else {
        content = await response.text();
      }

      // Parse if master_summary, otherwise keep raw
      let parsedContent = null;
      if (link.type === "master_summary") {
        try {
          parsedContent = parseSummaryContent(content, link.name);
        } catch (parseError) {
          console.warn("Parse failed, falling back to raw:", parseError);
        }
      }

      setFileViewer((prev) => ({
        ...prev,
        isLoading: false,
        content,
        parsedContent,
      }));
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return; // Silently ignore aborted fetches
      }
      setFileViewer((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : "Failed to load file",
      }));
    }
  }, []);

  const closeFileViewer = useCallback(() => {
    // Abort any in-flight fetch
    if (fileViewerAbortRef.current) {
      fileViewerAbortRef.current.abort();
      fileViewerAbortRef.current = null;
    }

    setFileViewer({
      isOpen: false,
      isLoading: false,
      error: null,
      filename: null,
      fileType: null,
      content: null,
      parsedContent: null,
      downloadUrl: null,
    });
  }, []);

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
    <div className="flex flex-1 min-h-0 flex-col">
      <div className="flex items-center justify-between gap-3 py-4">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold">Chat</h2>
          <Badge variant="muted" className="text-[11px] uppercase tracking-wide">
            {isStreaming ? "Streaming" : "Ready"}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          {isStreaming ? "Working…" : "Ask about traces, summaries, or IDs."}
        </p>
      </div>

      <div
        ref={messagesWrapperRef}
        className="flex-1 overflow-y-auto pb-6 pt-2"
      >
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
          {messages.length === 0 ? (
            <div className="flex min-h-[45vh] flex-col justify-center gap-3">
              <Badge variant="muted" className="w-fit px-3 py-1 text-xs uppercase">
                Logchat is ready
              </Badge>
              <div className="space-y-1">
                <p className="text-xl font-semibold tracking-tight">
                  How can I help you check logs today?
                </p>
                <p className="text-sm text-muted-foreground">
                  Include a timeframe, service/domain, and any trace IDs you have.
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
                onOpenFile={openFileViewer}
              />
            ))
          )}
        </div>
      </div>

      <div className="border-t border-border bg-background/80 py-4 backdrop-blur">
        <div className="mx-auto w-full max-w-3xl">
          <ChatInput
            input={input}
            setInput={setInput}
            onSend={sendMessage}
            isStreaming={isStreaming}
          />
        </div>
      </div>

      <FileViewerModal state={fileViewer} onClose={closeFileViewer} />
    </div>
  );
}
