import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "../ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import type { FileViewerState, ParsedSummaryContent } from "../../types";
import FileViewerHeader from "./FileViewerHeader";
import FileViewerLoading from "./FileViewerLoading";
import FileViewerError from "./FileViewerError";
import RawContentView from "./RawContentView";
import StructuredSummaryView from "./StructuredSummaryView";

interface FileViewerModalProps {
  state: FileViewerState;
  onClose: () => void;
}

export default function FileViewerModal({ state, onClose }: FileViewerModalProps) {
  const {
    isOpen,
    isLoading,
    error,
    filename,
    fileType,
    content,
    parsedContent,
    downloadUrl,
  } = state;

  // Determine if we should show structured view (master_summary with successful parse)
  const showStructured = fileType === "master_summary" && parsedContent !== null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-hidden p-0">
        <VisuallyHidden>
          <DialogTitle>File Viewer - {filename || "Loading..."}</DialogTitle>
        </VisuallyHidden>

        <FileViewerHeader
          filename={filename}
          fileType={fileType}
          downloadUrl={downloadUrl}
        />

        {isLoading && <FileViewerLoading />}

        {error && (
          <FileViewerError
            message={error}
            downloadUrl={downloadUrl}
            filename={filename}
          />
        )}

        {!isLoading && !error && content && (
          showStructured ? (
            <StructuredSummaryView data={parsedContent as ParsedSummaryContent} />
          ) : (
            <RawContentView content={content} />
          )
        )}
      </DialogContent>
    </Dialog>
  );
}
