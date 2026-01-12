import { MessageSquare, Archive, Trash2, MoreHorizontal } from "lucide-react";
import type { ConversationResponse } from "../types/conversation";
import { cn } from "../lib/utils";
import { Badge } from "./ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Button } from "./ui/button";

type ConversationItemProps = {
  conversation: ConversationResponse;
  isActive: boolean;
  onClick: () => void;
  onArchive?: () => void;
  onDelete?: () => void;
};

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function ConversationItem({
  conversation,
  isActive,
  onClick,
  onArchive,
  onDelete,
}: ConversationItemProps) {
  const title = conversation.title || "Untitled conversation";
  const hasActions = onArchive || onDelete;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className={cn(
        "group relative flex cursor-pointer flex-col gap-1 rounded-lg border px-3 py-2.5 text-left transition-colors",
        isActive
          ? "border-primary/30 bg-primary/5"
          : "border-transparent hover:bg-muted/50",
      )}
    >
      {/* Title row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="truncate text-sm font-medium">{title}</span>
        </div>

        {hasActions && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onArchive && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onArchive();
                  }}
                >
                  <Archive className="mr-2 h-4 w-4" />
                  Archive
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Meta row */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {conversation.project_code && (
          <Badge variant="muted" className="px-1.5 py-0 text-[10px]">
            {conversation.project_code}
          </Badge>
        )}
        <span>{formatRelativeTime(conversation.updated_at)}</span>
        <span className="text-muted-foreground/60">
          {conversation.message_count} msg{conversation.message_count !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Active indicator */}
      {isActive && (
        <div className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-primary" />
      )}
    </div>
  );
}
