export type Role = "user" | "bot";

export type DownloadType =
  | "relevant"
  | "less_relevant"
  | "not_relevant"
  | "trace_analysis"
  | "master_summary"
  | "verification";

export interface DownloadLink {
  name: string;
  url: string;
  type: DownloadType;
}

export interface Message {
  from: Role;
  text: string;
  isStreaming?: boolean;
  downloadLinks?: DownloadLink[];
}

export interface StreamEventPayload {
  event: string;
  data: string;
}

export interface ChatRequestBody {
  prompt: string;
  project: string;
  env: string;
  domain: string;
}

// ============================================
// File Viewer Types
// ============================================

/**
 * Metadata extracted from the summary header
 */
export interface SummaryMetadata {
  filename: string;
  generatedDate: string;
  totalTraces: number;
  totalLogEntries: number;
  model: string;
}

/**
 * Customer dispute information
 */
export interface CustomerDispute {
  date: string;
  username: string;
  rawText?: string;
}

/**
 * Individual trace analysis result
 */
export interface TraceAnalysis {
  traceNumber: number;
  traceId: string;
  relevanceScore: number;
  transactionStatus: string;
  keyFinding: string;
  recommendation: string | string[];
}

/**
 * Single entry in the transaction timeline
 */
export interface TimelineEntry {
  index: number;
  timestamp: string;
  level: "INFO" | "WARN" | "ERROR" | "TRACE" | "DEBUG";
  service: string;
  traceId: string;
  message: string;
}

/**
 * Fully parsed summary content
 */
export interface ParsedSummaryContent {
  metadata: SummaryMetadata;
  customerDispute: CustomerDispute | null;
  traces: TraceAnalysis[];
  timeline: TimelineEntry[];
  rawContent: string;
}

/**
 * File viewer modal state
 */
export interface FileViewerState {
  isOpen: boolean;
  isLoading: boolean;
  error: string | null;
  filename: string | null;
  fileType: DownloadType | null;
  content: string | null;
  parsedContent: ParsedSummaryContent | null;
  downloadUrl: string | null;
}
