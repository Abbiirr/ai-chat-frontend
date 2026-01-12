// ============================================
// Conversation API Types
// ============================================

// Request types
export interface CreateConversationRequest {
  project?: string;
  env?: string;
  domain?: string;
}

export interface UpdateConversationRequest {
  title?: string;
  domain?: string;
  status?: "active" | "archived";
}

export interface AddMessageRequest {
  content: string;
  cache?: CachePolicy;
}

export interface CachePolicy {
  enabled?: boolean;
  no_cache?: boolean;
  no_store?: boolean;
  ttl_seconds?: number;
}

// Response types
export interface ConversationResponse {
  conversation_id: string;
  project_code: string | null;
  env: string | null;
  domain: string | null;
  title: string | null;
  status: "active" | "archived";
  is_active: boolean;
  message_count: number;
  has_summary: boolean;
  created_at: string;
  updated_at: string;
}

export interface ConversationDetailResponse extends ConversationResponse {
  messages: MessageResponse[];
  summary: string | null;
  executions: ExecutionResponse[];
}

export interface ConversationListResponse {
  conversations: ConversationResponse[];
  total: number;
  limit: number;
  offset: number;
}

export interface MessageResponse {
  id: number;
  role: "user" | "assistant" | "system";
  content: string;
  message_type: string | null;
  message_metadata: Record<string, unknown> | null;
  token_count: number | null;
  created_at: string;
}

export interface ExecutionResponse {
  execution_id: string;
  status: "pending" | "running" | "completed" | "failed";
  prompt: string;
  extracted_params: Record<string, unknown> | null;
  trace_ids: string[] | null;
  report_files: string[] | null;
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
}

export interface StreamMessageResponse {
  execution_id: string;
  stream_url: string;
}

// State types for context
export interface ConversationState {
  currentConversationId: string | null;
  conversations: ConversationResponse[];
  messages: MessageResponse[];
  executions: ExecutionResponse[];
  isLoading: boolean;
  error: string | null;
  featureEnabled: boolean | null; // null = unknown, true = enabled, false = disabled (501)
}

// List query params
export interface ConversationListParams {
  project?: string;
  status?: "active" | "archived";
  limit?: number;
  offset?: number;
}

export interface MessageListParams {
  limit?: number;
  offset?: number;
}
