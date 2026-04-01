import * as React from "react";
import { cn } from "@/lib/utils";

export type CardVariant = "default" | "elevated" | "bordered" | "ghost";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padding?: "none" | "sm" | "md" | "lg";
}

const variantStyles: Record<CardVariant, React.CSSProperties> = {
  default: {
    background: "var(--bg-surface)",
    border: "1px solid var(--border)",
  },
  elevated: {
    background: "var(--bg-elevated)",
    border: "1px solid var(--border)",
    boxShadow: "0 4px 24px rgba(0,0,0,0.2)",
  },
  bordered: {
    background: "var(--bg-surface)",
    border: "1px solid var(--border-strong)",
  },
  ghost: {
    background: "transparent",
    border: "none",
  },
};

const paddingClasses: Record<NonNullable<CardProps["padding"]>, string> = {
  none: "",
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

export function Card({
  className,
  variant = "default",
  padding = "md",
  style,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cn("rounded-xl", paddingClasses[padding], className)}
      style={{ ...variantStyles[variant], ...style }}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex flex-col gap-1.5 pb-4", className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("text-base font-semibold", className)}
      style={{ color: "var(--text-primary)" }}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardDescription({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("text-sm", className)}
      style={{ color: "var(--text-muted)" }}
      {...props}
    >
      {children}
    </p>
  );
}

export function CardContent({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("", className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex items-center pt-4 gap-2", className)} {...props}>
      {children}
    </div>
  );
}
