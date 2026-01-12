import type {
  AddMessageRequest,
  ConversationDetailResponse,
  ConversationListParams,
  ConversationListResponse,
  ConversationResponse,
  CreateConversationRequest,
  MessageListParams,
  MessageResponse,
  StreamMessageResponse,
  UpdateConversationRequest,
} from "../types/conversation";

const apiBase = (() => {
  const env = (import.meta.env.VITE_API_URL as string | undefined) ?? "";
  return env.replace(/\/$/, "") || "http://10.112.30.10:8000";
})();

const buildUrl = (path: string): string =>
  `${apiBase}${path.startsWith("/") ? path : `/${path}`}`;

export class ConversationApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public statusText: string,
  ) {
    super(message);
    this.name = "ConversationApiError";
  }

  get isFeatureDisabled(): boolean {
    return this.status === 501;
  }

  get isNotFound(): boolean {
    return this.status === 404;
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const message = await response.text().catch(() => response.statusText);
    throw new ConversationApiError(message, response.status, response.statusText);
  }
  return response.json();
}

export const conversationApi = {
  /**
   * Create a new conversation
   */
  async create(data: CreateConversationRequest): Promise<ConversationResponse> {
    const response = await fetch(buildUrl("/api/conversations"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse<ConversationResponse>(response);
  },

  /**
   * List conversations with optional filters
   */
  async list(params?: ConversationListParams): Promise<ConversationListResponse> {
    const query = new URLSearchParams();
    if (params?.project) query.set("project", params.project);
    if (params?.status) query.set("status", params.status);
    if (params?.limit) query.set("limit", String(params.limit));
    if (params?.offset) query.set("offset", String(params.offset));

    const url = query.toString()
      ? `${buildUrl("/api/conversations")}?${query}`
      : buildUrl("/api/conversations");

    const response = await fetch(url);
    return handleResponse<ConversationListResponse>(response);
  },

  /**
   * Get a single conversation with messages and executions
   */
  async get(conversationId: string): Promise<ConversationDetailResponse> {
    const response = await fetch(buildUrl(`/api/conversations/${conversationId}`));
    return handleResponse<ConversationDetailResponse>(response);
  },

  /**
   * Update conversation (title, domain, status)
   */
  async update(
    conversationId: string,
    data: UpdateConversationRequest,
  ): Promise<ConversationResponse> {
    const response = await fetch(buildUrl(`/api/conversations/${conversationId}`), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse<ConversationResponse>(response);
  },

  /**
   * Archive (soft delete) a conversation
   */
  async delete(conversationId: string): Promise<ConversationResponse> {
    const response = await fetch(buildUrl(`/api/conversations/${conversationId}`), {
      method: "DELETE",
    });
    return handleResponse<ConversationResponse>(response);
  },

  /**
   * Add a message and start analysis pipeline
   * Returns execution_id and stream_url for SSE
   */
  async addMessage(
    conversationId: string,
    data: AddMessageRequest,
  ): Promise<StreamMessageResponse> {
    const response = await fetch(
      buildUrl(`/api/conversations/${conversationId}/messages`),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      },
    );
    return handleResponse<StreamMessageResponse>(response);
  },

  /**
   * Get messages for a conversation
   */
  async getMessages(
    conversationId: string,
    params?: MessageListParams,
  ): Promise<MessageResponse[]> {
    const query = new URLSearchParams();
    if (params?.limit) query.set("limit", String(params.limit));
    if (params?.offset) query.set("offset", String(params.offset));

    const url = query.toString()
      ? `${buildUrl(`/api/conversations/${conversationId}/messages`)}?${query}`
      : buildUrl(`/api/conversations/${conversationId}/messages`);

    const response = await fetch(url);
    return handleResponse<MessageResponse[]>(response);
  },

  /**
   * Build the SSE stream URL for an execution
   */
  buildStreamUrl(conversationId: string, executionId: string): string {
    return buildUrl(`/api/conversations/${conversationId}/stream/${executionId}`);
  },

  /**
   * Check if persistent conversations feature is enabled
   * Returns true if enabled, false if 501, throws on other errors
   */
  async checkFeatureEnabled(): Promise<boolean> {
    try {
      await this.list({ limit: 1 });
      return true;
    } catch (error) {
      if (error instanceof ConversationApiError && error.isFeatureDisabled) {
        return false;
      }
      throw error;
    }
  },
};

export type ConversationApi = typeof conversationApi;
