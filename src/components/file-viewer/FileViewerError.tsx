import { AlertCircle, Download } from "lucide-react";
import { Button } from "../ui/button";

interface FileViewerErrorProps {
  message: string;
  downloadUrl: string | null;
  filename: string | null;
}

export default function FileViewerError({
  message,
  downloadUrl,
  filename,
}: FileViewerErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
      <div className="rounded-full bg-destructive/10 p-3">
        <AlertCircle className="h-8 w-8 text-destructive" />
      </div>
      <div className="space-y-1">
        <p className="font-medium text-foreground">Failed to load file</p>
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
      {downloadUrl && (
        <Button variant="outline" asChild>
          <a href={downloadUrl} download={filename || true}>
            <Download className="mr-2 h-4 w-4" />
            Download instead
          </a>
        </Button>
      )}
    </div>
  );
}
