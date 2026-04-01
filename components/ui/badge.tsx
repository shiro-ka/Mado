import * as React from "react";
import { cn } from "@/lib/utils";

export type BadgeVariant = "default" | "success" | "warning" | "error" | "muted";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: "sm" | "md";
  dot?: boolean;
}

const variantStyles: Record<BadgeVariant, React.CSSProperties> = {
  default: {
    background: "rgba(124, 58, 237, 0.15)",
    color: "#a78bfa",
    border: "1px solid rgba(124, 58, 237, 0.3)",
  },
  success: {
    background: "rgba(52, 211, 153, 0.1)",
    color: "#34d399",
    border: "1px solid rgba(52, 211, 153, 0.25)",
  },
  warning: {
    background: "rgba(251, 191, 36, 0.1)",
    color: "#fbbf24",
    border: "1px solid rgba(251, 191, 36, 0.25)",
  },
  error: {
    background: "rgba(248, 113, 113, 0.1)",
    color: "#f87171",
    border: "1px solid rgba(248, 113, 113, 0.25)",
  },
  muted: {
    background: "var(--bg-elevated)",
    color: "var(--text-muted)",
    border: "1px solid var(--border)",
  },
};

const dotColors: Record<BadgeVariant, string> = {
  default: "#a78bfa",
  success: "#34d399",
  warning: "#fbbf24",
  error: "#f87171",
  muted: "var(--text-subtle)",
};

export function Badge({
  className,
  variant = "default",
  size = "sm",
  dot = false,
  style,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-medium rounded-full",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm",
        className
      )}
      style={{ ...variantStyles[variant], ...style }}
      {...props}
    >
      {dot && (
        <span
          className="inline-block w-1.5 h-1.5 rounded-full shrink-0"
          style={{ background: dotColors[variant] }}
        />
      )}
      {children}
    </span>
  );
}
