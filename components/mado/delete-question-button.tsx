"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DeleteQuestionButtonProps {
  rkey: string;
}

type State = "idle" | "confirm" | "submitting" | "error";

export function DeleteQuestionButton({ rkey }: DeleteQuestionButtonProps) {
  const [state, setState] = React.useState<State>("idle");
  const router = useRouter();

  const handleClick = async () => {
    if (state === "idle" || state === "error") {
      setState("confirm");
      return;
    }

    if (state === "confirm") {
      setState("submitting");
      try {
        const res = await fetch(`/api/questions/${rkey}`, { method: "DELETE" });
        if (!res.ok) {
          setState("error");
        } else {
          router.push("/dashboard/questions");
          router.refresh();
        }
      } catch {
        setState("error");
      }
    }
  };

  return (
    <Button
      variant="destructive"
      size="sm"
      leftIcon={<Trash2 style={{ width: 14, height: 14 }} />}
      className="flex-1 sm:flex-none"
      loading={state === "submitting"}
      onClick={handleClick}
    >
      {state === "confirm" ? "本当に削除しますか？" : state === "error" ? "再試行" : "削除"}
    </Button>
  );
}
