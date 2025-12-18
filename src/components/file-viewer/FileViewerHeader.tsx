import { Download, FileText } from "lucide-react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import type { DownloadType } from "../../types";
import { cn } from "../../lib/utils";

interface FileViewerHeaderProps {
  filename: string | null;
  fileType: DownloadType | null;
  downloadUrl: string | null;
}

const typeConfig: Record<DownloadType, { label: string; className: string }> = {
  relevant: {
    label: "Highly Relevant",
    className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  },
  less_relevant: {
    label: "Less Relevant",
    className: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  },
  not_relevant: {
    label: "Not Relevant",
    className: "bg-slate-500/10 text-slate-700 dark:text-slate-300",
  },
  trace_analysis: {
    label: "Trace Analysis",
    className: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
  },
  master_summary: {
    label: "Master Summary",
    className: "bg-primary/10 text-primary",
  },
  verification: {
    label: "Verification",
    className: "bg-violet-500/10 text-violet-700 dark:text-violet-300",
  },
};

export default function FileViewerHeader({
  filename,
  fileType,
  downloadUrl,
}: FileViewerHeaderProps) {
  const config = fileType ? typeConfig[fileType] : null;

  return (
    <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-4 pr-14">
      <div className="flex items-start gap-3 min-w-0">
        <div className="rounded-lg bg-primary/10 p-2 shrink-0">
          <FileText className="h-5 w-5 text-primary" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {config && (
              <Badge
                variant="outline"
                className={cn("text-xs font-medium", config.className)}
              >
                {config.label}
              </Badge>
            )}
          </div>
          <p className="truncate text-sm font-medium text-foreground" title={filename || ""}>
            {filename || "Unknown file"}
          </p>
        </div>
      </div>
      {downloadUrl && (
        <Button variant="outline" size="sm" asChild className="shrink-0">
          <a href={downloadUrl} download={filename || true}>
            <Download className="mr-2 h-4 w-4" />
            Download
          </a>
        </Button>
      )}
    </div>
  );
}
