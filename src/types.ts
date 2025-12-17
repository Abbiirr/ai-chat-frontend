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
