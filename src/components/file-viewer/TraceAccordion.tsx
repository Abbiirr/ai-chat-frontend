import { useState } from "react";
import { ChevronDown, Activity } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible";
import { cn } from "../../lib/utils";
import type { TraceAnalysis } from "../../types";
import TraceAccordionItem from "./TraceAccordionItem";

interface TraceAccordionProps {
  traces: TraceAnalysis[];
}

export default function TraceAccordion({ traces }: TraceAccordionProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (traces.length === 0) return null;

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
            <Activity className="h-5 w-5 text-primary" />
            <span className="font-semibold">Trace Analysis</span>
            <span className="text-sm text-muted-foreground">
              ({traces.length} traces)
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
          <div className="divide-y divide-border">
            {traces.map((trace) => (
              <TraceAccordionItem key={trace.traceId} trace={trace} />
            ))}
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
