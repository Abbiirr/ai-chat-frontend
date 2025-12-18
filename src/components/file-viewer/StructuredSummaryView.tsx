import { ScrollArea } from "../ui/scroll-area";
import type { ParsedSummaryContent } from "../../types";
import SummaryMetadataCard from "./SummaryMetadataCard";
import CustomerDisputeCard from "./CustomerDisputeCard";
import TraceAccordion from "./TraceAccordion";
import TimelineSection from "./TimelineSection";

interface StructuredSummaryViewProps {
  data: ParsedSummaryContent;
}

export default function StructuredSummaryView({ data }: StructuredSummaryViewProps) {
  return (
    <ScrollArea className="h-[calc(80vh-120px)]">
      <div className="space-y-4 p-6">
        <SummaryMetadataCard metadata={data.metadata} />

        {data.customerDispute && (
          <CustomerDisputeCard dispute={data.customerDispute} />
        )}

        {data.traces.length > 0 && (
          <TraceAccordion traces={data.traces} />
        )}

        {data.timeline.length > 0 && (
          <TimelineSection entries={data.timeline} />
        )}
      </div>
    </ScrollArea>
  );
}
