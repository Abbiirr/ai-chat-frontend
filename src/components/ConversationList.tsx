import { useCallback, useMemo, useState } from "react";
import { Plus, RefreshCw, MessageSquareOff, Search, Filter } from "lucide-react";
import type { ConversationResponse } from "../types/conversation";
import { conversationApi } from "../lib/conversationApi";
import { useConversation } from "./conversation-provider";
import { ConversationItem } from "./ConversationItem";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";
import { Skeleton } from "./ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";

type ConversationListProps = {
  onNewConversation: () => void;
};

export function ConversationList({ onNewConversation }: ConversationListProps) {
  const {
    currentConversationId,
    conversations,
    featureEnabled,
    isLoadingList,
    listError,
    loadConversation,
    clearConversation,
    refreshConversationList,
    removeConversationFromList,
  } = useConversation();

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [projectFilter, setProjectFilter] = useState<string | null>(null);

  // Archive confirmation dialog state
  const [archiveDialog, setArchiveDialog] = useState<{
    isOpen: boolean;
    conversation: ConversationResponse | null;
  }>({ isOpen: false, conversation: null });
  const [isArchiving, setIsArchiving] = useState(false);

  // Get unique projects for filter
  const availableProjects = useMemo(() => {
    const projects = new Set<string>();
    conversations.forEach((c) => {
      if (c.project_code) projects.add(c.project_code);
    });
    return Array.from(projects).sort();
  }, [conversations]);

  // Filter conversations based on search and project
  const filteredConversations = useMemo(() => {
    return conversations.filter((c) => {
      // Project filter
      if (projectFilter && c.project_code !== projectFilter) {
        return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const title = (c.title || "").toLowerCase();
        const project = (c.project_code || "").toLowerCase();
        const domain = (c.domain || "").toLowerCase();

        if (!title.includes(query) && !project.includes(query) && !domain.includes(query)) {
          return false;
        }
      }

      return true;
    });
  }, [conversations, searchQuery, projectFilter]);

  const handleSelectConversation = useCallback(
    async (conversationId: string) => {
      if (conversationId === currentConversationId) return;
      try {
        await loadConversation(conversationId);
      } catch (err) {
        console.error("Failed to load conversation:", err);
      }
    },
    [currentConversationId, loadConversation],
  );

  const handleArchiveClick = useCallback((conversation: ConversationResponse) => {
    setArchiveDialog({ isOpen: true, conversation });
  }, []);

  const handleArchiveConfirm = useCallback(async () => {
    const conversation = archiveDialog.conversation;
    if (!conversation) return;

    setIsArchiving(true);
    try {
      await conversationApi.delete(conversation.conversation_id);
      removeConversationFromList(conversation.conversation_id);
      if (currentConversationId === conversation.conversation_id) {
        clearConversation();
      }
      setArchiveDialog({ isOpen: false, conversation: null });
    } catch (err) {
      console.error("Failed to archive conversation:", err);
    } finally {
      setIsArchiving(false);
    }
  }, [archiveDialog.conversation, currentConversationId, clearConversation, removeConversationFromList]);

  const handleArchiveCancel = useCallback(() => {
    setArchiveDialog({ isOpen: false, conversation: null });
  }, []);

  // Feature disabled state - show new conversation button only
  if (featureEnabled === false) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-border p-3">
          <h2 className="text-sm font-semibold">Conversations</h2>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onNewConversation}
          >
            <Plus className="h-4 w-4" />
            <span className="sr-only">New conversation</span>
          </Button>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-4 text-center">
          <MessageSquareOff className="h-8 w-8 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            History not available
          </p>
          <p className="text-xs text-muted-foreground/70">
            Conversations are not persisted on the server
          </p>
        </div>
        <div className="border-t border-border p-2">
          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={onNewConversation}
          >
            <Plus className="h-4 w-4" />
            New conversation
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border p-3">
        <h2 className="text-sm font-semibold">Conversations</h2>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={refreshConversationList}
            disabled={isLoadingList}
          >
            <RefreshCw className={`h-4 w-4 ${isLoadingList ? "animate-spin" : ""}`} />
            <span className="sr-only">Refresh</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onNewConversation}
          >
            <Plus className="h-4 w-4" />
            <span className="sr-only">New conversation</span>
          </Button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex items-center gap-2 border-b border-border p-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 pl-8 text-sm"
          />
        </div>
        {availableProjects.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant={projectFilter ? "secondary" : "ghost"}
                size="icon"
                className="h-8 w-8 shrink-0"
              >
                <Filter className="h-4 w-4" />
                <span className="sr-only">Filter by project</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuLabel>Filter by project</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={projectFilter === null}
                onCheckedChange={() => setProjectFilter(null)}
              >
                All projects
              </DropdownMenuCheckboxItem>
              {availableProjects.map((project) => (
                <DropdownMenuCheckboxItem
                  key={project}
                  checked={projectFilter === project}
                  onCheckedChange={() =>
                    setProjectFilter(projectFilter === project ? null : project)
                  }
                >
                  {project}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* List */}
      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-1 p-2">
          {isLoadingList ? (
            // Loading skeletons
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-2 rounded-lg border border-transparent p-3">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))
          ) : listError ? (
            // Error state
            <div className="flex flex-col items-center gap-2 p-4 text-center">
              <p className="text-sm text-destructive">{listError}</p>
              <Button variant="outline" size="sm" onClick={refreshConversationList}>
                Retry
              </Button>
            </div>
          ) : filteredConversations.length === 0 ? (
            // Empty state
            <div className="flex flex-col items-center gap-2 p-4 text-center">
              <MessageSquareOff className="h-8 w-8 text-muted-foreground/50" />
              {searchQuery || projectFilter ? (
                <>
                  <p className="text-sm text-muted-foreground">No matching conversations</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearchQuery("");
                      setProjectFilter(null);
                    }}
                  >
                    Clear filters
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">No conversations yet</p>
                  <Button variant="outline" size="sm" onClick={onNewConversation}>
                    <Plus className="mr-1 h-4 w-4" />
                    Start a conversation
                  </Button>
                </>
              )}
            </div>
          ) : (
            // Conversation list
            filteredConversations.map((conversation) => (
              <ConversationItem
                key={conversation.conversation_id}
                conversation={conversation}
                isActive={conversation.conversation_id === currentConversationId}
                onClick={() => handleSelectConversation(conversation.conversation_id)}
                onArchive={() => handleArchiveClick(conversation)}
              />
            ))
          )}
        </div>
      </ScrollArea>

      {/* Results count when filtering */}
      {(searchQuery || projectFilter) && !isLoadingList && !listError && (
        <div className="border-t border-border px-3 py-1.5 text-xs text-muted-foreground">
          {filteredConversations.length} of {conversations.length} conversations
        </div>
      )}

      {/* New conversation button (footer) */}
      <div className="border-t border-border p-2">
        <Button
          variant="outline"
          className="w-full justify-start gap-2"
          onClick={onNewConversation}
        >
          <Plus className="h-4 w-4" />
          New conversation
        </Button>
      </div>

      {/* Archive Confirmation Dialog */}
      <AlertDialog open={archiveDialog.isOpen} onOpenChange={(open) => {
        if (!open) handleArchiveCancel();
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive conversation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will archive "{archiveDialog.conversation?.title || "Untitled conversation"}".
              Archived conversations can be restored later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isArchiving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleArchiveConfirm}
              disabled={isArchiving}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isArchiving ? "Archiving..." : "Archive"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
