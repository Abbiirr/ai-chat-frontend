// store/chatStore.js
import { create } from "zustand";

export const useChatStore = create((set) => ({
  // State
  conversations: [],
  activeConversationId: null,
  messages: [],
  isStreaming: false,

  // Context state
  selectedTrace: null,
  traceDetails: null,
  downloadLinks: [],

  // UI state
  isSidebarOpen: true,
  isContextPanelOpen: true,
  isLogViewerOpen: false,

  // Actions
  addConversation: (conversation) =>
    set((state) => ({
      conversations: [
        ...state.conversations,
        {
          id: Date.now().toString(),
          title: conversation.title || "New conversation",
          timestamp: new Date().toISOString(),
          messages: [],
          ...conversation,
        },
      ],
    })),

  setActiveConversation: (id) =>
    set((state) => {
      const conversation = state.conversations.find((c) => c.id === id);
      return {
        activeConversationId: id,
        messages: conversation?.messages || [],
      };
    }),

  addMessage: (message) =>
    set((state) => ({
      messages: [
        ...state.messages,
        {
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          ...message,
        },
      ],
    })),

  updateLastMessage: (update) =>
    set((state) => {
      const messages = [...state.messages];
      const lastIndex = messages.length - 1;
      if (lastIndex >= 0) {
        messages[lastIndex] = { ...messages[lastIndex], ...update };
      }
      return { messages };
    }),

  setSelectedTrace: (traceId, details = null) =>
    set({
      selectedTrace: traceId,
      traceDetails: details,
    }),

  setDownloadLinks: (links) => set({ downloadLinks: links }),

  toggleSidebar: () =>
    set((state) => ({
      isSidebarOpen: !state.isSidebarOpen,
    })),

  toggleContextPanel: () =>
    set((state) => ({
      isContextPanelOpen: !state.isContextPanelOpen,
    })),

  openLogViewer: (traceId) =>
    set({
      isLogViewerOpen: true,
      selectedTrace: traceId,
    }),

  closeLogViewer: () =>
    set({
      isLogViewerOpen: false,
    }),

  clearCurrentChat: () =>
    set({
      messages: [],
      selectedTrace: null,
      traceDetails: null,
      downloadLinks: [],
    }),
}));
