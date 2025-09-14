// hooks/useChat.js
import { useState, useRef, useCallback, useEffect } from "react";
import { api } from "../services/api";
import { SSEHandler, SSE_EVENTS } from "../services/sseHandler";

export function useChat() {
  const [messages, setMessages] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentTrace, setCurrentTrace] = useState(null);
  const [downloadLinks, setDownloadLinks] = useState([]);

  const sseHandler = useRef(new SSEHandler());

  // Register SSE event handlers
  useEffect(() => {
    const handler = sseHandler.current;

    handler.registerHandler(SSE_EVENTS.EXTRACTED_PARAMS, (data) => {
      appendToLastBotMessage(formatExtractedParams(data));
    });

    handler.registerHandler(SSE_EVENTS.FOUND_TRACES, (data) => {
      appendToLastBotMessage(`Found ${data.count} requests`);
      if (data.trace_ids?.length > 0) {
        setCurrentTrace(data.trace_ids[0]);
      }
    });

    handler.registerHandler(SSE_EVENTS.VERIFICATION_RESULTS, (data) => {
      handleVerificationResults(data);
    });

    handler.registerHandler(SSE_EVENTS.COMPILED_SUMMARY, (data) => {
      handleCompiledSummary(data);
    });

    return () => handler.disconnect();
  }, []);

  const appendToLastBotMessage = useCallback((text) => {
    setMessages((prev) => {
      const last = prev[prev.length - 1];
      if (last?.from === "bot") {
        return [
          ...prev.slice(0, -1),
          { ...last, text: last.text + text + "\n\n" },
        ];
      }
      return prev;
    });
  }, []);

  const formatExtractedParams = (params) => {
    const { time_frame, domain, query_keys } = params.parameters;
    const keywords = Array.isArray(query_keys)
      ? query_keys.join(", ")
      : query_keys;
    return `I have found the following parameters from your request\nTime Frame: ${time_frame}\nDomain: ${domain}\nKeywords: ${keywords}`;
  };

  const handleVerificationResults = (data) => {
    const text = typeof data === "string" ? data : JSON.stringify(data);
    const summaryText = text.split("Relevant files:")[0].trim();

    const parseFiles = (match) => {
      if (!match || !match[1]) return [];
      return match[1]
        .split(",")
        .map((f) => f.trim().replace(/['"]/g, ""))
        .filter((f) => f.length > 0);
    };

    const relevantMatch = text.match(/Relevant files:\s*\[(.*?)\]/);
    const lessRelevantMatch = text.match(/Less Relevant Files:\s*\[(.*?)\]/);
    const notRelevantMatch = text.match(/Not Relevant Files:\s*\[(.*?)\]/);

    const links = [
      ...parseFiles(relevantMatch).map((name) => ({
        name,
        url: api.downloadFile(name),
        type: "relevant",
      })),
      ...parseFiles(lessRelevantMatch).map((name) => ({
        name,
        url: api.downloadFile(name),
        type: "less_relevant",
      })),
      ...parseFiles(notRelevantMatch).map((name) => ({
        name,
        url: api.downloadFile(name),
        type: "not_relevant",
      })),
    ];

    appendToLastBotMessage(summaryText);
    setDownloadLinks((prev) => [...prev, ...links]);
  };

  const handleCompiledSummary = (data) => {
    const links = [];

    if (Array.isArray(data.created_files)) {
      data.created_files.forEach((path) => {
        const name = path.split(/[\\/]/).pop();
        links.push({
          name,
          url: api.downloadFile(name),
          type: "trace_analysis",
        });
      });
    }

    if (data.master_summary_file) {
      const name = data.master_summary_file.split(/[\\/]/).pop();
      links.push({
        name,
        url: api.downloadFile(name),
        type: "master_summary",
      });
    }

    setDownloadLinks((prev) => [...prev, ...links]);
  };

  const sendMessage = useCallback(
    async (text, project, env, domain) => {
      if (!text.trim() || isStreaming) return;

      // Add user message
      setMessages((prev) => [
        ...prev,
        {
          from: "user",
          text,
          timestamp: new Date().toISOString(),
        },
      ]);

      // Add bot message placeholder
      setMessages((prev) => [
        ...prev,
        {
          from: "bot",
          text: "",
          isStreaming: true,
          timestamp: new Date().toISOString(),
        },
      ]);

      setIsStreaming(true);
      setDownloadLinks([]);

      try {
        const { streamUrl } = await api.sendMessage(text, project, env, domain);

        sseHandler.current.connect(
          api.createSSEConnection(streamUrl).url,
          (eventType, parsed) => {
            console.log("Unhandled event:", eventType, parsed);
          },
          (error) => {
            setIsStreaming(false);
            setMessages((prev) =>
              prev.map((msg) =>
                msg.isStreaming ? { ...msg, isStreaming: false } : msg
              )
            );
          },
          () => {
            setIsStreaming(false);
            setMessages((prev) =>
              prev.map((msg) =>
                msg.isStreaming ? { ...msg, isStreaming: false } : msg
              )
            );
          }
        );
      } catch (error) {
        console.error("Send message error:", error);
        setIsStreaming(false);
        setMessages((prev) => prev.filter((msg) => !msg.isStreaming));
      }
    },
    [isStreaming]
  );

  const clearChat = useCallback(() => {
    setMessages([]);
    setCurrentTrace(null);
    setDownloadLinks([]);
    sseHandler.current.disconnect();
  }, []);

  return {
    messages,
    isStreaming,
    currentTrace,
    downloadLinks,
    sendMessage,
    clearChat,
  };
}
