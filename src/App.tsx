import { useState, useCallback, useEffect } from "react";
import { Menu, X } from "lucide-react";
import ChatInterface from "./components/ChatInterface";
import { ThemeToggle } from "./components/ThemeToggle";
import { ThemeProvider } from "./components/theme-provider";
import { ConversationProvider, useConversation } from "./components/conversation-provider";
import { ConversationList } from "./components/ConversationList";
import { ConversationHeader } from "./components/ConversationHeader";
import { Button } from "./components/ui/button";

// Helper to extract conversation ID from URL path
function getConversationIdFromUrl(): string | null {
  const match = window.location.pathname.match(/^\/c\/([a-zA-Z0-9-]+)/);
  return match ? match[1] : null;
}

// Helper to update URL without page reload
function updateUrl(conversationId: string | null) {
  const newPath = conversationId ? `/c/${conversationId}` : "/";
  if (window.location.pathname !== newPath) {
    window.history.pushState({ conversationId }, "", newPath);
  }
}

function AppContent() {
  const {
    clearConversation,
    currentConversationId,
    loadConversation,
    featureEnabled
  } = useConversation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Sync URL with current conversation ID
  useEffect(() => {
    if (featureEnabled === false) return; // Don't update URL if feature disabled
    updateUrl(currentConversationId);
  }, [currentConversationId, featureEnabled]);

  // Load conversation from URL on mount
  useEffect(() => {
    const urlConversationId = getConversationIdFromUrl();
    if (urlConversationId && urlConversationId !== currentConversationId) {
      loadConversation(urlConversationId).catch((err) => {
        console.error("Failed to load conversation from URL:", err);
        // Clear invalid URL
        updateUrl(null);
      });
    }
  }, []); // Only run on mount

  // Handle browser back/forward navigation
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      const conversationId = event.state?.conversationId || getConversationIdFromUrl();
      if (conversationId) {
        loadConversation(conversationId).catch(console.error);
      } else {
        clearConversation();
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [loadConversation, clearConversation]);

  const handleNewConversation = useCallback(() => {
    clearConversation();
    updateUrl(null);
    setSidebarOpen(false);
  }, [clearConversation]);

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur">
        <div className="flex w-full items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            {/* Mobile sidebar toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 lg:hidden"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
              <span className="sr-only">Toggle sidebar</span>
            </Button>
            <div className="leading-tight">
              <p className="text-xs font-medium text-muted-foreground">
                Observability copilot
              </p>
              <h1 className="text-base font-semibold tracking-tight">Logchat</h1>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Main layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <>
          {/* Mobile overlay */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 z-30 bg-black/50 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* Sidebar content */}
          <aside
            className={`
              fixed inset-y-0 left-0 z-40 w-72 border-r border-border bg-background pt-14 transition-transform duration-200 lg:static lg:z-0 lg:translate-x-0 lg:pt-0
              ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
            `}
          >
            <ConversationList onNewConversation={handleNewConversation} />
          </aside>
        </>

        {/* Main content */}
        <main className="flex flex-1 flex-col overflow-hidden">
          {/* Conversation header */}
          <ConversationHeader />

          {/* Chat interface */}
          <div className="mx-auto flex w-full max-w-4xl flex-1 min-h-0 flex-col px-4">
            <ChatInterface />
          </div>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="chat-theme">
      <ConversationProvider>
        <AppContent />
      </ConversationProvider>
    </ThemeProvider>
  );
}
