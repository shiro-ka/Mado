"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helper?: string;
  leftAddon?: React.ReactNode;
  rightAddon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helper, leftAddon, rightAddon, id, ...props }, ref) => {
    const inputId = id ?? (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium"
            style={{ color: "var(--text-muted)" }}
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftAddon && (
            <div
              className="absolute left-3 flex items-center pointer-events-none"
              style={{ color: "var(--text-subtle)" }}
            >
              {leftAddon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              "w-full rounded-lg px-4 py-3 text-sm transition-all duration-200",
              "focus:outline-none focus:ring-2",
              "placeholder:opacity-50",
              error
                ? "ring-1 ring-red-500/50 focus:ring-red-500/60"
                : "focus:ring-violet-500/40",
              leftAddon && "pl-10",
              rightAddon && "pr-10",
              className
            )}
            style={{
              background: "var(--bg-elevated)",
              color: "var(--text-primary)",
              border: `1px solid ${error ? "rgba(239,68,68,0.4)" : "var(--border)"}`,
            }}
            {...props}
          />
          {rightAddon && (
            <div
              className="absolute right-3 flex items-center"
              style={{ color: "var(--text-subtle)" }}
            >
              {rightAddon}
            </div>
          )}
        </div>
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

Input.displayName = "Input";
