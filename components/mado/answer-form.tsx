"use client";

import * as React from "react";
import { Send, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface AnswerFormProps {
  /** AT-URI of the question (blue.mado.koe) this answer is for */
  koeUri: string;
  onSuccess?: (answerUri: string) => void;
}

type FormState = "idle" | "submitting" | "success" | "error";

const MAX_CHARS = 1000;

export function AnswerForm({ koeUri, onSuccess }: AnswerFormProps) {
  const [body, setBody] = React.useState("");
  const [crosspost, setCrosspost] = React.useState(false);
  const [formState, setFormState] = React.useState<FormState>("idle");
  const [errorMsg, setErrorMsg] = React.useState("");

  const isValid = body.trim().length > 0 && body.length <= MAX_CHARS;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || formState === "submitting") return;

    setFormState("submitting");
    setErrorMsg("");

    try {
      const res = await fetch("/api/answers/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ koeUri, body: body.trim(), crosspost }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { message?: string };
        throw new Error(data.message ?? "回答の投稿に失敗しました");
      }

      const data = await res.json() as { uri: string };
      setFormState("success");
      onSuccess?.(data.uri);
    } catch (err) {
      setFormState("error");
      setErrorMsg(err instanceof Error ? err.message : "回答の投稿に失敗しました");
    }
  };

  if (formState === "success") {
    return (
      <div
        className="rounded-xl p-6 flex flex-col items-center gap-3 text-center"
        style={{
          background: "rgba(52, 211, 153, 0.08)",
          border: "1px solid rgba(52, 211, 153, 0.25)",
        }}
      >
        <CheckCircle2 style={{ width: 36, height: 36, color: "#34d399" }} />
        <div>
          <p className="font-semibold" style={{ color: "var(--text-primary)" }}>
            回答を投稿しました
          </p>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            PDSに保存されました。
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Textarea
        placeholder="回答を入力してください..."
        value={body}
        onChange={(e) => setBody(e.target.value)}
        maxLength={MAX_CHARS}
        showCount
        rows={4}
        disabled={formState === "submitting"}
        error={
          body.length > MAX_CHARS
            ? `${MAX_CHARS}文字以内で入力してください`
            : undefined
        }
      />

      {formState === "error" && (
        <div
          className="rounded-lg p-3 flex items-center gap-2 text-sm"
          style={{
            background: "rgba(248, 113, 113, 0.08)",
            border: "1px solid rgba(248, 113, 113, 0.25)",
            color: "var(--error)",
          }}
        >
          <AlertCircle style={{ width: 15, height: 15 }} />
          {errorMsg}
        </div>
      )}

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={crosspost}
            onChange={(e) => setCrosspost(e.target.checked)}
            disabled={formState === "submitting"}
            className="w-4 h-4 accent-violet-500 cursor-pointer"
          />
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            Bskyにもポスト
          </span>
        </label>
        <Button
          type="submit"
          loading={formState === "submitting"}
          disabled={!isValid}
          rightIcon={<Send style={{ width: 15, height: 15 }} />}
        >
          回答を投稿
        </Button>
      </div>
    </form>
  );
}
