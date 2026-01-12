import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type {
  ConversationResponse,
  ConversationState,
  MessageResponse,
  ExecutionResponse,
} from "../types/conversation";
import { conversationApi, ConversationApiError } from "../lib/conversationApi";

const STORAGE_KEY = "logchat-conversation-id";

type ConversationContextValue = ConversationState & {
  // Actions
  setCurrentConversation: (id: string | null) => void;
  createConversation: (
    project: string,
    env: string,
    domain: string,
  ) => Promise<ConversationResponse>;
  loadConversation: (id: string) => Promise<void>;
  refreshMessages: () => Promise<void>;
  refreshConversationList: () => Promise<void>;
  updateConversationInList: (conversation: ConversationResponse) => void;
  removeConversationFromList: (conversationId: string) => void;
  addOptimisticMessage: (content: string) => void;
  updateMessages: (messages: MessageResponse[]) => void;
  addExecution: (execution: ExecutionResponse) => void;
  updateExecution: (execution: Partial<ExecutionResponse> & { execution_id: string }) => void;
  clearConversation: () => void;
  setError: (error: string | null) => void;
  isLoadingList: boolean;
  listError: string | null;
};

const ConversationContext = createContext<ConversationContextValue | null>(null);

type ConversationProviderProps = {
  children: React.ReactNode;
};

export function ConversationProvider({ children }: ConversationProviderProps) {
  const [state, setState] = useState<ConversationState>({
    currentConversationId: null,
    conversations: [],
    messages: [],
    executions: [],
    isLoading: false,
    error: null,
    featureEnabled: null,
  });
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  // Check feature availability on mount
  useEffect(() => {
    const checkFeature = async () => {
      try {
        const enabled = await conversationApi.checkFeatureEnabled();
        setState((prev) => ({ ...prev, featureEnabled: enabled }));

        // Restore last conversation if feature is enabled
        if (enabled) {
          const storedId = localStorage.getItem(STORAGE_KEY);
          if (storedId) {
            setState((prev) => ({ ...prev, currentConversationId: storedId }));
          }
          // Fetch conversation list
          setIsLoadingList(true);
          try {
            const response = await conversationApi.list({ status: "active", limit: 100 });
            setState((prev) => ({ ...prev, conversations: response.conversations }));
          } catch (listError) {
            console.error("Failed to fetch initial conversation list:", listError);
          } finally {
            setIsLoadingList(false);
          }
        }
      } catch {
        // Network error or other issue - assume feature might be available
        setState((prev) => ({ ...prev, featureEnabled: null }));
      }
    };
    checkFeature();
  }, []);

  const setCurrentConversation = useCallback((id: string | null) => {
    setState((prev) => ({ ...prev, currentConversationId: id }));
    if (id) {
      localStorage.setItem(STORAGE_KEY, id);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const createConversation = useCallback(
    async (project: string, env: string, domain: string) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      try {
        const conversation = await conversationApi.create({ project, env, domain });
        setState((prev) => ({
          ...prev,
          currentConversationId: conversation.conversation_id,
          conversations: [conversation, ...prev.conversations],
          messages: [],
          executions: [],
          isLoading: false,
          featureEnabled: true,
        }));
        localStorage.setItem(STORAGE_KEY, conversation.conversation_id);
        return conversation;
      } catch (error) {
        const message =
          error instanceof ConversationApiError
            ? error.isFeatureDisabled
              ? "Conversation history is not enabled on the server"
              : error.message
            : "Failed to create conversation";

        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: message,
          featureEnabled:
            error instanceof ConversationApiError && error.isFeatureDisabled
              ? false
              : prev.featureEnabled,
        }));
        throw error;
      }
    },
    [],
  );

  const loadConversation = useCallback(async (id: string) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const detail = await conversationApi.get(id);

      // Extract conversation metadata for the list
      const conversationMeta: ConversationResponse = {
        conversation_id: detail.conversation_id,
        project_code: detail.project_code,
        env: detail.env,
        domain: detail.domain,
        title: detail.title,
        status: detail.status,
        is_active: detail.is_active,
        message_count: detail.message_count,
        has_summary: detail.has_summary,
        created_at: detail.created_at,
        updated_at: detail.updated_at,
      };

      setState((prev) => {
        // Update or add conversation to the list
        const existingIndex = prev.conversations.findIndex(
          (c) => c.conversation_id === id,
        );
        const updatedConversations =
          existingIndex >= 0
            ? prev.conversations.map((c, i) =>
                i === existingIndex ? conversationMeta : c,
              )
            : [conversationMeta, ...prev.conversations];

        return {
          ...prev,
          currentConversationId: id,
          conversations: updatedConversations,
          messages: detail.messages,
          executions: detail.executions,
          isLoading: false,
        };
      });
      localStorage.setItem(STORAGE_KEY, id);
    } catch (error) {
      const message =
        error instanceof ConversationApiError
          ? error.isNotFound
            ? "Conversation not found"
            : error.message
          : "Failed to load conversation";

      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: message,
      }));

      // Clear stored ID if conversation not found
      if (error instanceof ConversationApiError && error.isNotFound) {
        localStorage.removeItem(STORAGE_KEY);
        setState((prev) => ({ ...prev, currentConversationId: null }));
      }
      throw error;
    }
  }, []);

  const refreshMessages = useCallback(async () => {
    const { currentConversationId } = state;
    if (!currentConversationId) return;

    try {
      const messages = await conversationApi.getMessages(currentConversationId);
      setState((prev) => ({ ...prev, messages }));
    } catch (error) {
      console.error("Failed to refresh messages:", error);
    }
  }, [state.currentConversationId]);

  const refreshConversationList = useCallback(async () => {
    if (state.featureEnabled === false) {
      return;
    }

    setIsLoadingList(true);
    setListError(null);

    try {
      const response = await conversationApi.list({ status: "active", limit: 100 });
      setState((prev) => ({ ...prev, conversations: response.conversations }));
    } catch (error) {
      if (error instanceof ConversationApiError && error.isFeatureDisabled) {
        setState((prev) => ({ ...prev, conversations: [], featureEnabled: false }));
      } else {
        setListError("Failed to load conversations");
        console.error("Failed to fetch conversations:", error);
      }
    } finally {
      setIsLoadingList(false);
    }
  }, [state.featureEnabled]);

  const updateConversationInList = useCallback(
    (conversation: ConversationResponse) => {
      setState((prev) => ({
        ...prev,
        conversations: prev.conversations.map((c) =>
          c.conversation_id === conversation.conversation_id ? conversation : c,
        ),
      }));
    },
    [],
  );

  const removeConversationFromList = useCallback((conversationId: string) => {
    setState((prev) => ({
      ...prev,
      conversations: prev.conversations.filter(
        (c) => c.conversation_id !== conversationId,
      ),
    }));
  }, []);

  const addOptimisticMessage = useCallback((content: string) => {
    const optimisticMessage: MessageResponse = {
      id: -Date.now(), // Negative ID to indicate optimistic
      role: "user",
      content,
      message_type: "prompt",
      message_metadata: null,
      token_count: null,
      created_at: new Date().toISOString(),
    };
    setState((prev) => ({
      ...prev,
      messages: [...prev.messages, optimisticMessage],
    }));
  }, []);

  const updateMessages = useCallback((messages: MessageResponse[]) => {
    setState((prev) => ({ ...prev, messages }));
  }, []);

  const addExecution = useCallback((execution: ExecutionResponse) => {
    setState((prev) => ({
      ...prev,
      executions: [...prev.executions, execution],
    }));
  }, []);

  const updateExecution = useCallback(
    (execution: Partial<ExecutionResponse> & { execution_id: string }) => {
      setState((prev) => ({
        ...prev,
        executions: prev.executions.map((e) =>
          e.execution_id === execution.execution_id ? { ...e, ...execution } : e,
        ),
      }));
    },
    [],
  );

  const clearConversation = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentConversationId: null,
      messages: [],
      executions: [],
      error: null,
    }));
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const setError = useCallback((error: string | null) => {
    setState((prev) => ({ ...prev, error }));
  }, []);

  const value = useMemo<ConversationContextValue>(
    () => ({
      ...state,
      setCurrentConversation,
      createConversation,
      loadConversation,
      refreshMessages,
      refreshConversationList,
      updateConversationInList,
      removeConversationFromList,
      addOptimisticMessage,
      updateMessages,
      addExecution,
      updateExecution,
      clearConversation,
      setError,
      isLoadingList,
      listError,
    }),
    [
      state,
      setCurrentConversation,
      createConversation,
      loadConversation,
      refreshMessages,
      refreshConversationList,
      updateConversationInList,
      removeConversationFromList,
      addOptimisticMessage,
      updateMessages,
      addExecution,
      updateExecution,
      clearConversation,
      setError,
      isLoadingList,
      listError,
    ],
  );

  return (
    <ConversationContext.Provider value={value}>
      {children}
    </ConversationContext.Provider>
  );
}

export function useConversation() {
  const context = useContext(ConversationContext);
  if (!context) {
    throw new Error("useConversation must be used within a ConversationProvider");
  }
  return context;
}
