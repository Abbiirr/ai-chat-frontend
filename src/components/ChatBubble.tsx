import { ArrowDownToLine } from "lucide-react";

import type { DownloadLink, Message } from "../types";
import { cn } from "../lib/utils";
import { Badge } from "./ui/badge";
import { Skeleton } from "./ui/skeleton";

type ChatBubbleProps = {
  message: Message;
  index: number;
  downloadLinks?: DownloadLink[];
};

const categoryConfig: Record<
  DownloadLink["type"],
  { title: string; tone: string; dot: string }
> = {
  relevant: {
    title: "Highly Relevant",
    tone: "border-emerald-500/30 bg-emerald-500/10 text-emerald-100",
    dot: "bg-emerald-400",
  },
  less_relevant: {
    title: "Less Relevant",
    tone: "border-amber-500/30 bg-amber-500/10 text-amber-100",
    dot: "bg-amber-400",
  },
  not_relevant: {
    title: "Not Relevant",
    tone: "border-slate-500/30 bg-slate-500/10 text-slate-200",
    dot: "bg-slate-300",
  },
  trace_analysis: {
    title: "Trace Analysis",
    tone: "border-sky-500/30 bg-sky-500/10 text-sky-100",
    dot: "bg-sky-300",
  },
  master_summary: {
    title: "Master Summary",
    tone: "border-primary/40 bg-primary/15 text-primary",
    dot: "bg-primary",
  },
  verification: {
    title: "Verification",
    tone: "border-violet-500/30 bg-violet-500/10 text-violet-100",
    dot: "bg-violet-300",
  },
};

export default function ChatBubble({
  message,
  index: _index, // reserved for keyed animations
  downloadLinks = [],
}: ChatBubbleProps) {
  const isUser = message.from === "user";
  const body =
    message.text || (message.isStreaming ? "Analyzing the latest traces..." : "");
  const groupedLinks = downloadLinks.reduce<
    Partial<Record<DownloadLink["type"], DownloadLink[]>>
  >((acc, link) => {
    acc[link.type] = [...(acc[link.type] ?? []), link];
    return acc;
  }, {});

  return (
    <div
      className={cn(
        "flex w-full gap-3",
        isUser ? "justify-end text-right" : "justify-start text-left",
      )}
    >
      <div
        className={cn(
          "flex max-w-4xl flex-col gap-3",
          isUser ? "items-end" : "items-start",
        )}
      >
        <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
          <Badge variant={isUser ? "secondary" : "info"} className="px-2 py-1">
            {isUser ? "You" : "AI"}
          </Badge>
          <span className="h-px w-10 bg-border/70" aria-hidden />
        </div>

        <div
          className={cn(
            "w-full rounded-2xl px-4 py-3 text-sm shadow-sm transition-colors",
            isUser
              ? "bg-primary text-primary-foreground"
              : "border border-border/70 bg-card/80 text-foreground",
          )}
        >
          <div className="whitespace-pre-wrap leading-relaxed">{body}</div>
          {message.isStreaming && (
            <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
              <Skeleton className="h-2 w-10 bg-primary/30" />
              <Skeleton className="h-2 w-16 bg-muted" />
            </div>
          )}
        </div>

        {Object.entries(groupedLinks).length > 0 && (
          <div className="w-full space-y-3">
            {Object.entries(groupedLinks).map(([category, links]) => {
              const config =
                categoryConfig[category as DownloadLink["type"]] ??
                categoryConfig.relevant;
              return (
                <div
                  key={category}
                  className={cn(
                    "w-full rounded-xl border px-3 py-3 shadow-sm",
                    config.tone,
                  )}
                >
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide">
                    <span className={cn("h-2.5 w-2.5 rounded-full", config.dot)} />
                    {config.title}
                  </div>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    {links.map((link, idx) => (
                      <a
                        key={`${category}-${idx}-${link.name}`}
                        href={link.url}
                        download={link.name}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm font-medium text-foreground underline-offset-4 transition hover:border-primary/60 hover:bg-primary/10"
                      >
                        <ArrowDownToLine className="h-4 w-4 shrink-0" />
                        <span className="truncate">{link.name}</span>
                      </a>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
