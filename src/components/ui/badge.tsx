import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary/15 text-primary ring-offset-background",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground ring-offset-background",
        outline: "text-foreground",
        success:
          "border-transparent bg-emerald-500/15 text-emerald-200 ring-offset-background",
        warning:
          "border-transparent bg-amber-500/15 text-amber-200 ring-offset-background",
        info: "border-transparent bg-accent/15 text-accent-foreground ring-offset-background",
        muted: "border-transparent bg-muted text-muted-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
