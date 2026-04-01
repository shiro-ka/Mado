"use client";

import * as React from "react";
import { Send, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface SendQuestionFormProps {
  boxOwnerDid: string;
  boxRkey: string;
  publicKeyHex: string;
  senderHandle: string;
  onSuccess?: () => void;
}

type FormState = "idle" | "submitting" | "success" | "error";

const MAX_CHARS = 500;

export function SendQuestionForm({
  boxOwnerDid,
  boxRkey,
  publicKeyHex,
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
        body: JSON.stringify({
          body: body.trim(),
          boxOwnerDid,
          boxRkey,
          publicKeyHex,
        }),
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
      <div
        className="rounded-xl p-6 flex flex-col items-center gap-3 text-center"
        style={{
          background: "rgba(52, 211, 153, 0.08)",
          border: "1px solid rgba(52, 211, 153, 0.25)",
        }}
      >
        <CheckCircle2
          style={{ width: 40, height: 40, color: "#34d399" }}
        />
        <div>
          <p
            className="font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            質問を送信しました！
          </p>
          <p
            className="text-sm mt-1"
            style={{ color: "var(--text-muted)" }}
          >
            相手に届くまでしばらくお待ちください。
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setFormState("idle")}
          className="mt-1"
        >
          別の質問を送る
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Sender disclosure */}
      <div
        className="rounded-lg p-3 flex items-start gap-2.5 text-sm"
        style={{
          background: "var(--accent-light)",
          border: "1px solid rgba(124, 58, 237, 0.25)",
        }}
      >
        <AlertCircle
          className="mt-0.5 shrink-0"
          style={{ width: 15, height: 15, color: "#a78bfa" }}
        />
        <p style={{ color: "#c4b5fd" }}>
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

      <Button
        type="submit"
        variant="default"
        size="lg"
        loading={formState === "submitting"}
        disabled={!isValid}
        rightIcon={<Send style={{ width: 16, height: 16 }} />}
        className="w-full"
      >
        質問を送る
      </Button>
    </form>
  );
}
