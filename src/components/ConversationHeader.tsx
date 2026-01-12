import { useState, useCallback } from "react";
import { Check, Pencil, X, Archive } from "lucide-react";
import { useConversation } from "./conversation-provider";
import { conversationApi } from "../lib/conversationApi";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
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

export function ConversationHeader() {
  const {
    currentConversationId,
    conversations,
    featureEnabled,
    clearConversation,
    updateConversationInList,
    removeConversationFromList,
  } = useConversation();

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Archive confirmation dialog state
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);

  // Find current conversation from list
  const currentConversation = conversations.find(
    (c) => c.conversation_id === currentConversationId,
  );

  const handleStartEdit = useCallback(() => {
    setEditTitle(currentConversation?.title || "");
    setIsEditing(true);
  }, [currentConversation?.title]);

  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
    setEditTitle("");
  }, []);

  const handleSaveTitle = useCallback(async () => {
    if (!currentConversationId || !editTitle.trim()) return;

    setIsSaving(true);
    try {
      const updated = await conversationApi.update(currentConversationId, {
        title: editTitle.trim(),
      });
      // Update the conversation in the list with the new title
      updateConversationInList(updated);
      setIsEditing(false);
    } catch (err) {
      console.error("Failed to update title:", err);
    } finally {
      setIsSaving(false);
    }
  }, [currentConversationId, editTitle, updateConversationInList]);

  const handleArchiveClick = useCallback(() => {
    setShowArchiveDialog(true);
  }, []);

  const handleArchiveConfirm = useCallback(async () => {
    if (!currentConversationId) return;

    setIsArchiving(true);
    try {
      await conversationApi.delete(currentConversationId);
      removeConversationFromList(currentConversationId);
      clearConversation();
      setShowArchiveDialog(false);
    } catch (err) {
      console.error("Failed to archive conversation:", err);
    } finally {
      setIsArchiving(false);
    }
  }, [currentConversationId, clearConversation, removeConversationFromList]);

  // Don't show if no conversation or feature disabled
  if (!currentConversationId || featureEnabled === false) {
    return null;
  }

  const title = currentConversation?.title || "Untitled conversation";

  return (
    <>
      <div className="flex items-center justify-between gap-3 border-b border-border bg-background/80 px-4 py-2 backdrop-blur">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {isEditing ? (
            <div className="flex flex-1 items-center gap-2">
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveTitle();
                  if (e.key === "Escape") handleCancelEdit();
                }}
                className="flex-1 rounded-md border border-input bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Conversation title"
                autoFocus
                disabled={isSaving}
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={handleSaveTitle}
                disabled={isSaving || !editTitle.trim()}
              >
                <Check className="h-4 w-4" />
                <span className="sr-only">Save</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={handleCancelEdit}
                disabled={isSaving}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Cancel</span>
              </Button>
            </div>
          ) : (
            <>
              <h2 className="truncate text-sm font-medium">{title}</h2>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0"
                onClick={handleStartEdit}
              >
                <Pencil className="h-3 w-3" />
                <span className="sr-only">Edit title</span>
              </Button>
            </>
          )}

          {/* Context badges */}
          {!isEditing && currentConversation && (
            <div className="hidden items-center gap-1.5 sm:flex">
              {currentConversation.project_code && (
                <Badge variant="muted" className="px-1.5 py-0 text-[10px]">
                  {currentConversation.project_code}
                </Badge>
              )}
              {currentConversation.env && (
                <Badge variant="muted" className="px-1.5 py-0 text-[10px]">
                  {currentConversation.env}
                </Badge>
              )}
              {currentConversation.domain && (
                <Badge variant="muted" className="px-1.5 py-0 text-[10px]">
                  {currentConversation.domain}
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        {!isEditing && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
            onClick={handleArchiveClick}
            title="Archive conversation"
          >
            <Archive className="h-4 w-4" />
            <span className="sr-only">Archive</span>
          </Button>
        )}
      </div>

      {/* Archive Confirmation Dialog */}
      <AlertDialog open={showArchiveDialog} onOpenChange={setShowArchiveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive conversation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will archive "{title}".
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
    </>
  );
}
