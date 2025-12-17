import type { ChangeEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { FolderKanban, GlobeLock, Send, Server } from "lucide-react";
import ToolButton from "./ToolButton";
import "./ChatInput.css";

type ChatInputProps = {
  input: string;
  setInput: React.Dispatch<React.SetStateAction<string>>;
  onSend: (
    message: string,
    project: string,
    env: string,
    domain: string
  ) => void;
  isStreaming: boolean;
};

export default function ChatInput({
  input,
  setInput,
  onSend,
  isStreaming,
}: ChatInputProps) {
  const [project, setProject] = useState("NCC");
  const [env, setEnv] = useState("DEV");
  const [domain, setDomain] = useState("General");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${ta.scrollHeight}px`;
  }, [input]);

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${ta.scrollHeight}px`;
  };

  const handleSend = () => {
    onSend(input, project, env, domain);
  };

  return (
    <footer className="input-container">
      <div className="input-wrapper">
        <div className="input-field">
          <textarea
            ref={textareaRef}
            className="message-input"
            value={input}
            onChange={handleChange}
            placeholder="Type your message..."
            rows={1}
          />

          <div className="controls-row">
            <div className="tool-buttons">
              <ToolButton
                options={["NCC", "ABBL", "GIGLY"]}
                onSelect={setProject}
                disabled={isStreaming}
                title={`Project: ${project}`}
                icon={FolderKanban}
              />
              <ToolButton
                options={["DEV", "UAT", "PROD"]}
                onSelect={setEnv}
                disabled={isStreaming}
                title={`Env: ${env}`}
                icon={Server}
              />
              <ToolButton
                options={[
                  "General",
                  "Transaction",
                  "Notification",
                  "OTP",
                  "Registration",
                  "User Info",
                ]}
                onSelect={setDomain}
                disabled={isStreaming}
                title={`Domain: ${domain}`}
                icon={GlobeLock}
              />
              <span className="param-pill">{project}</span>
              <span className="param-pill">{env}</span>
              <span className="param-pill">{domain}</span>
            </div>

            <button
              className={`send-button ${
                input.trim() && !isStreaming ? "active" : "disabled"
              }`}
              onClick={handleSend}
              disabled={!input.trim() || isStreaming}
            >
              <Send size={16} />
            </button>
          </div>
        </div>

        <div className="input-hint">
          Chat Assistant check console for debug info.
        </div>
      </div>
    </footer>
  );
}
