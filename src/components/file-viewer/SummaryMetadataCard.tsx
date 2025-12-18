import { Calendar, Hash, Database, Cpu } from "lucide-react";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import type { SummaryMetadata } from "../../types";

interface SummaryMetadataCardProps {
  metadata: SummaryMetadata;
}

export default function SummaryMetadataCard({ metadata }: SummaryMetadataCardProps) {
  return (
    <Card>
      <CardContent className="pt-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-muted-foreground">Generated:</span>
            <span className="font-medium truncate">{metadata.generatedDate}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Cpu className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-muted-foreground">Model:</span>
            <span className="font-medium truncate" title={metadata.model}>
              {metadata.model}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Hash className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-muted-foreground">Traces:</span>
            <Badge variant="secondary" className="text-xs">
              {metadata.totalTraces}
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Database className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-muted-foreground">Log entries:</span>
            <Badge variant="secondary" className="text-xs">
              {metadata.totalLogEntries}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
