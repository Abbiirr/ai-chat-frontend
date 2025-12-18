import { useState } from "react";
import { ChevronDown, Clock } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible";
import { Badge } from "../ui/badge";
import { ScrollArea } from "../ui/scroll-area";
import { cn } from "../../lib/utils";
import type { TimelineEntry } from "../../types";

interface TimelineSectionProps {
  entries: TimelineEntry[];
}

const levelConfig: Record<TimelineEntry["level"], { bg: string; text: string }> = {
  ERROR: { bg: "bg-red-500/10", text: "text-red-700 dark:text-red-300" },
  WARN: { bg: "bg-amber-500/10", text: "text-amber-700 dark:text-amber-300" },
  INFO: { bg: "bg-blue-500/10", text: "text-blue-700 dark:text-blue-300" },
  DEBUG: { bg: "bg-gray-500/10", text: "text-gray-600 dark:text-gray-400" },
  TRACE: { bg: "bg-slate-500/10", text: "text-slate-600 dark:text-slate-400" },
};

export default function TimelineSection({ entries }: TimelineSectionProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (entries.length === 0) return null;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <button
          className={cn(
            "flex w-full items-center justify-between rounded-lg border border-border bg-card px-4 py-3 text-left transition-colors hover:bg-muted",
            isOpen && "rounded-b-none border-b-0"
          )}
        >
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <span className="font-semibold">Transaction Timeline</span>
            <span className="text-sm text-muted-foreground">
              ({entries.length} entries)
            </span>
          </div>
          <ChevronDown
            className={cn(
              "h-5 w-5 text-muted-foreground transition-transform duration-200",
              isOpen && "rotate-180"
            )}
          />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="rounded-b-lg border border-t-0 border-border bg-card">
          <ScrollArea className="h-[300px]">
            <div className="divide-y divide-border">
              {entries.map((entry) => {
                const config = levelConfig[entry.level] || levelConfig.INFO;
                const truncatedTraceId =
                  entry.traceId.length > 8
                    ? `${entry.traceId.slice(0, 8)}...`
                    : entry.traceId;

                return (
                  <div
                    key={entry.index}
                    className="flex items-start gap-2 px-4 py-2 text-xs"
                  >
                    <span className="shrink-0 w-6 text-right text-muted-foreground">
                      {entry.index}.
                    </span>
                    <span className="shrink-0 w-20 font-mono text-muted-foreground">
                      {entry.timestamp.split(" ")[1] || entry.timestamp}
                    </span>
                    <Badge
                      variant="outline"
                      className={cn(
                        "shrink-0 w-14 justify-center text-[10px] font-semibold",
                        config.bg,
                        config.text
                      )}
                    >
                      {entry.level}
                    </Badge>
                    <span className="shrink-0 w-28 truncate text-muted-foreground" title={entry.service}>
                      {entry.service}
                    </span>
                    <code className="shrink-0 w-16 font-mono text-muted-foreground" title={entry.traceId}>
                      {truncatedTraceId}
                    </code>
                    <span className="flex-1 truncate" title={entry.message}>
                      {entry.message}
                    </span>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
