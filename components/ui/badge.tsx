import * as React from "react";
import { cn } from "@/lib/utils";

export type BadgeVariant = "default" | "success" | "warning" | "error" | "muted";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: "sm" | "md";
  dot?: boolean;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-blue-600/15 text-blue-400 border border-blue-600/30",
  success: "bg-emerald-400/10 text-emerald-400 border border-emerald-400/25",
  warning: "bg-amber-400/10 text-amber-400 border border-amber-400/25",
  error: "bg-red-400/10 text-red-400 border border-red-400/25",
  muted: "bg-elevated text-muted border border-border",
};

const dotClasses: Record<BadgeVariant, string> = {
  default: "bg-blue-400",
  success: "bg-emerald-400",
  warning: "bg-amber-400",
  error: "bg-red-400",
  muted: "bg-subtle",
};

export function Badge({
  className,
  variant = "default",
  size = "sm",
  dot = false,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-medium rounded-full",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm",
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn("inline-block w-1.5 h-1.5 rounded-full shrink-0", dotClasses[variant])}
        />
      )}
      {children}
    </span>
  );
}
