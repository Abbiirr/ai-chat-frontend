import { useState } from "react";
import { ChevronRight, AlertCircle, CheckCircle, HelpCircle } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible";
import { Badge } from "../ui/badge";
import { cn } from "../../lib/utils";
import type { TraceAnalysis } from "../../types";

interface TraceAccordionItemProps {
  trace: TraceAnalysis;
}

const getScoreColor = (score: number): string => {
  if (score >= 80) return "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10";
  if (score >= 60) return "text-amber-600 dark:text-amber-400 bg-amber-500/10";
  if (score >= 40) return "text-orange-600 dark:text-orange-400 bg-orange-500/10";
  return "text-red-600 dark:text-red-400 bg-red-500/10";
};

const getStatusIcon = (status: string) => {
  const normalized = status.toLowerCase();
  if (normalized.includes("success") || normalized.includes("resolved")) {
    return <CheckCircle className="h-4 w-4 text-emerald-500" />;
  }
  if (normalized.includes("error") || normalized.includes("fail")) {
    return <AlertCircle className="h-4 w-4 text-red-500" />;
  }
  return <HelpCircle className="h-4 w-4 text-muted-foreground" />;
};

export default function TraceAccordionItem({ trace }: TraceAccordionItemProps) {
  const [isOpen, setIsOpen] = useState(false);

  const truncatedId =
    trace.traceId.length > 16
      ? `${trace.traceId.slice(0, 8)}...${trace.traceId.slice(-4)}`
      : trace.traceId;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <button className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50">
          <ChevronRight
            className={cn(
              "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
              isOpen && "rotate-90"
            )}
          />
          <div className="flex flex-1 items-center gap-3 min-w-0 flex-wrap">
            <span className="shrink-0 text-xs text-muted-foreground">
              #{trace.traceNumber}
            </span>
            <code className="truncate text-xs font-mono text-muted-foreground">
              {truncatedId}
            </code>
            <Badge
              variant="outline"
              className={cn(
                "shrink-0 text-xs font-semibold",
                getScoreColor(trace.relevanceScore)
              )}
            >
              {trace.relevanceScore}/100
            </Badge>
            <div className="flex items-center gap-1 shrink-0">
              {getStatusIcon(trace.transactionStatus)}
              <span className="text-xs text-muted-foreground">
                {trace.transactionStatus}
              </span>
            </div>
          </div>
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="space-y-3 bg-muted/30 px-4 py-3 pl-11">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Key Finding
            </p>
            <p className="mt-1 text-sm leading-relaxed">{trace.keyFinding}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Recommendation
            </p>
            {Array.isArray(trace.recommendation) ? (
              <ul className="mt-1 list-inside list-disc space-y-1 text-sm leading-relaxed">
                {trace.recommendation.map((rec, idx) => (
                  <li key={idx}>{rec}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 text-sm leading-relaxed">{trace.recommendation}</p>
            )}
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
