import type { LucideIcon } from "lucide-react";
import { Check, Settings2 } from "lucide-react";

import { cn } from "../lib/utils";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

type ToolButtonProps = {
  options?: string[];
  value?: string;
  onSelect?: (option: string) => void;
  disabled?: boolean;
  title?: string;
  icon?: LucideIcon;
};

export default function ToolButton({
  options = [],
  value,
  onSelect = () => {},
  disabled = false,
  title = "Select",
  icon = Settings2,
}: ToolButtonProps) {
  const IconComponent = icon;
  const safeValue = value ?? options[0] ?? "";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || options.length === 0}
          className={cn(
            "rounded-lg border-border bg-muted px-3 py-2 text-xs font-semibold shadow-sm transition hover:bg-background",
            disabled && "cursor-not-allowed opacity-60",
          )}
        >
          <IconComponent className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">{title}</span>
          <span className="ml-2 rounded-md bg-background px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {safeValue}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-52">
        <DropdownMenuLabel className="text-xs uppercase text-muted-foreground">
          {title}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {options.map((opt) => (
          <DropdownMenuItem
            key={opt}
            onSelect={() => onSelect(opt)}
            className="flex items-center gap-2"
          >
            {opt}
            {opt === value && <Check className="ml-auto h-4 w-4 text-primary" />}
          </DropdownMenuItem>
        ))}
        {options.length === 0 && (
          <DropdownMenuItem disabled>No options</DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
