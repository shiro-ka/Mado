"use client";

import * as React from "react";
import { Send, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface SendQuestionFormProps {
  boxOwnerDid: string;
  boxRkey: string;
  senderHandle: string;
  onSuccess?: () => void;
}

type FormState = "idle" | "submitting" | "success" | "error";

const MAX_CHARS = 500;

export function SendQuestionForm({
  boxOwnerDid,
  boxRkey,
  senderHandle,
  onSuccess,
}: SendQuestionFormProps) {
  const [body, setBody] = React.useState("");
  const [formState, setFormState] = React.useState<FormState>("idle");
  const [errorMsg, setErrorMsg] = React.useState("");

  const isValid = body.trim().length > 0 && body.length <= MAX_CHARS;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || formState === "submitting") return;

    setFormState("submitting");
    setErrorMsg("");

    try {
      const res = await fetch("/api/questions/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: body.trim(), boxOwnerDid, boxRkey }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { message?: string };
        throw new Error(data.message ?? "送信に失敗しました");
      }

      setFormState("success");
      setBody("");
      onSuccess?.();
    } catch (err) {
      setFormState("error");
      setErrorMsg(err instanceof Error ? err.message : "送信に失敗しました");
    }
  };

  if (formState === "success") {
    return (
      <div className="rounded-xl p-6 flex flex-col items-center gap-3 text-center bg-emerald-400/8 border border-emerald-400/25">
        <CheckCircle2 size={40} className="text-emerald-400" />
        <div>
          <p className="font-semibold text-primary">質問を送信しました！</p>
          <p className="text-sm mt-1 text-muted">相手に届くまでしばらくお待ちください。</p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setFormState("idle")} className="mt-1">
          別の質問を送る
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Sender disclosure */}
      <div className="rounded-lg p-3 flex items-start gap-2.5 text-sm bg-accent-light border border-violet-600/25">
        <AlertCircle size={15} className="mt-0.5 shrink-0 text-violet-400" />
        <p className="text-violet-300">
          この質問は{" "}
          <span className="font-semibold">@{senderHandle}</span> として相手に届きます。
          送り主はボックスのオーナーのみに開示されます。
        </p>
      </div>

      <Textarea
        label="質問内容"
        placeholder="質問を入力してください..."
        value={body}
        onChange={(e) => setBody(e.target.value)}
        maxLength={MAX_CHARS}
        showCount
        rows={5}
        disabled={formState === "submitting"}
        error={
          body.length > MAX_CHARS
            ? `${MAX_CHARS}文字以内で入力してください`
            : undefined
        }
      />

      {formState === "error" && (
        <div className="rounded-lg p-3 flex items-center gap-2 text-sm bg-red-400/8 border border-red-400/25 text-error">
          <AlertCircle size={15} />
          {errorMsg}
        </div>
      )}

      <Button
        type="submit"
        variant="default"
        size="lg"
        loading={formState === "submitting"}
        disabled={!isValid}
        rightIcon={<Send size={16} />}
        className="w-full"
      >
        質問を送る
      </Button>
    </form>
  );
}
