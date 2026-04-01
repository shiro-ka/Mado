"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helper?: string;
  maxLength?: number;
  showCount?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      label,
      error,
      helper,
      maxLength,
      showCount = false,
      id,
      value,
      onChange,
      ...props
    },
    ref
  ) => {
    const [charCount, setCharCount] = React.useState(
      typeof value === "string" ? value.length : 0
    );

    const inputId =
      id ?? (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setCharCount(e.target.value.length);
      onChange?.(e);
    };

    const isNearLimit =
      maxLength && charCount > maxLength * 0.8;
    const isOverLimit = maxLength && charCount > maxLength;

    return (
      <div className="flex flex-col gap-1.5 w-full">
        <div className="flex items-center justify-between">
          {label && (
            <label
              htmlFor={inputId}
              className="text-sm font-medium"
              style={{ color: "var(--text-muted)" }}
            >
              {label}
            </label>
          )}
          {(showCount || maxLength) && (
            <span
              className="text-xs tabular-nums"
              style={{
                color: isOverLimit
                  ? "var(--error)"
                  : isNearLimit
                  ? "var(--warning)"
                  : "var(--text-subtle)",
              }}
            >
              {charCount}
              {maxLength ? `/${maxLength}` : ""}
            </span>
          )}
        </div>
        <textarea
          ref={ref}
          id={inputId}
          value={value}
          onChange={handleChange}
          maxLength={maxLength}
          className={cn(
            "w-full rounded-lg px-4 py-3 text-sm transition-all duration-200 resize-y",
            "focus:outline-none focus:ring-2 min-h-[120px]",
            "placeholder:opacity-50",
            error
              ? "ring-1 ring-red-500/50 focus:ring-red-500/60"
              : "focus:ring-violet-500/40",
            className
          )}
          style={{
            background: "var(--bg-elevated)",
            color: "var(--text-primary)",
            border: `1px solid ${error ? "rgba(239,68,68,0.4)" : "var(--border)"}`,
          }}
          {...props}
        />
        {error && (
          <p className="text-xs" style={{ color: "var(--error)" }}>
            {error}
          </p>
        )}
        {helper && !error && (
          <p className="text-xs" style={{ color: "var(--text-subtle)" }}>
            {helper}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
