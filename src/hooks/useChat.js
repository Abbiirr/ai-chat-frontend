// hooks/useChat.js
import { useState, useRef, useCallback } from "react";
import { api } from "../services/api";
import { SSEHandler } from "../services/sseHandler";

export default function useChat() {
  const [messages, setMessages] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentTrace, setCurrentTrace] = useState(null);
  const [downloadLinks, setDownloadLinks] = useState([]);

  const sseRef = useRef(new SSEHandler());

  const clearStreamingFlags = useCallback(
    (arr) => arr.map((m) => (m.isStreaming ? { ...m, isStreaming: false } : m)),
    []
  );

  const sendMessage = useCallback(
    async (text, project, env, domain) => {
      if (!text || isStreaming) return;
      setMessages((prev) => [...prev, { id: Date.now(), from: "user", text }]);
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, from: "bot", text: "", isStreaming: true },
      ]);
      setIsStreaming(true);
      setDownloadLinks([]);

      try {
        const { streamUrl } = await api.sendMessage(text, project, env, domain);
        const conn = api.createSSEConnection(streamUrl);

        sseRef.current.connect(
          conn.url,
          (eventType, parsed) => {
            setMessages((prev) => {
              const last = prev[prev.length - 1];
              if (last?.from === "bot") {
                return [
                  ...prev.slice(0, -1),
                  {
                    ...last,
                    text:
                      last.text +
                      (typeof parsed === "string"
                        ? parsed
                        : JSON.stringify(parsed)),
                  },
                ];
              }
              return prev;
            });
          },
          () => {
            setIsStreaming(false);
            setMessages((prev) => clearStreamingFlags(prev));
          },
          () => {
            setIsStreaming(false);
            setMessages((prev) => clearStreamingFlags(prev));
          }
        );
      } catch (err) {
        console.error("sendMessage error", err);
        setIsStreaming(false);
        setMessages((prev) => prev.filter((p) => !p.isStreaming));
      }
    },
    [isStreaming, clearStreamingFlags]
  );

  const clearChat = useCallback(() => {
    setMessages([]);
    setCurrentTrace(null);
    setDownloadLinks([]);
    sseRef.current.disconnect();
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

// Provide a named export for compatibility with existing imports
export { useChat };
