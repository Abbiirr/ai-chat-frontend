import type { ChangeEvent, KeyboardEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { FolderKanban, GlobeLock, Send, Server } from "lucide-react";

import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import ToolButton from "./ToolButton";

type ChatInputProps = {
  input: string;
  setInput: React.Dispatch<React.SetStateAction<string>>;
  onSend: (
    message: string,
    project: string,
    env: string,
    domain: string,
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
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;
    onSend(trimmed, project, env, domain);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <ToolButton
          options={["NCC", "ABBL", "GIGLY"]}
          onSelect={setProject}
          value={project}
          disabled={isStreaming}
          title="Project"
          icon={FolderKanban}
        />
        <ToolButton
          options={["DEV", "UAT", "PROD"]}
          onSelect={setEnv}
          value={env}
          disabled={isStreaming}
          title="Environment"
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
          value={domain}
          disabled={isStreaming}
          title="Domain"
          icon={GlobeLock}
        />

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="muted">{project}</Badge>
          <Badge variant="muted">{env}</Badge>
          <Badge variant="muted">{domain}</Badge>
        </div>
      </div>

      <div className="flex flex-col gap-3 md:flex-row">
        <Textarea
          ref={textareaRef}
          className="min-h-[140px] flex-1 resize-none bg-muted"
          value={input}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Describe the issue, include trace IDs, timeframes, or services..."
          rows={1}
        />
        <div className="flex justify-end md:w-28">
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isStreaming}
            className="h-11 w-full gap-2 self-end"
          >
            <Send className="h-4 w-4" />
            {isStreaming ? "Streaming..." : "Send"}
          </Button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Chat Assistant streams responses from the backend. Check the console for SSE
        debug info.
      </p>
    </div>
  );
}
