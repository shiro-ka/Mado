"use client";

import * as React from "react";
import { Ban, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BlockButtonProps {
  senderDid: string;
}

type State = "idle" | "confirm" | "submitting" | "done" | "unblocking" | "error";

export function BlockButton({ senderDid }: BlockButtonProps) {
  const [state, setState] = React.useState<State>("idle");

  const handleClick = async () => {
    // First click (or retry after error): ask for confirmation
    if (state === "idle" || state === "error") {
      setState("confirm");
      return;
    }

    // Second click: execute block
    if (state === "confirm") {
      setState("submitting");
      try {
        const res = await fetch("/api/blocks/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ senderDid }),
        });
        if (!res.ok) {
          setState("error");
        } else {
          setState("done");
        }
      } catch {
        setState("error");
      }
    }
  };

  const handleUnblock = async () => {
    setState("unblocking");
    try {
      const res = await fetch("/api/blocks/remove", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senderDid }),
      });
      if (!res.ok) {
        setState("done");
      } else {
        setState("idle");
      }
    } catch {
      setState("done");
    }
  };

  if (state === "done" || state === "unblocking") {
    return (
      <div className="flex items-center gap-2 flex-1 sm:flex-none">
        <div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm"
          style={{ color: "var(--text-muted)" }}
        >
          <CheckCircle2 style={{ width: 14, height: 14 }} />
          ブロックしました
        </div>
        <Button
          variant="ghost"
          size="sm"
          loading={state === "unblocking"}
          onClick={handleUnblock}
          style={{ color: "var(--text-subtle)", fontSize: "0.75rem" }}
        >
          解除
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant={state === "confirm" ? "destructive" : "outline"}
      size="sm"
      leftIcon={<Ban style={{ width: 14, height: 14 }} />}
      className="flex-1 sm:flex-none"
      loading={state === "submitting"}
      onClick={handleClick}
    >
      {state === "confirm" ? "本当にブロックしますか？" : state === "error" ? "再試行" : "送信者をブロック"}
    </Button>
  );
}
