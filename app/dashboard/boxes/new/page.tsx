"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type FormState = "idle" | "submitting" | "error";

export default function NewBoxPage() {
  const router = useRouter();
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [isOpen, setIsOpen] = React.useState(true);
  const [formState, setFormState] = React.useState<FormState>("idle");
  const [error, setError] = React.useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || formState === "submitting") return;

    setFormState("submitting");
    setError("");

    try {
      const res = await fetch("/api/boxes/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          isOpen,
        }),
      });

      const data = await res.json() as { rkey?: string; error?: string; message?: string };

      if (!res.ok) {
        throw new Error(data.message ?? data.error ?? "作成に失敗しました");
      }

      router.push("/dashboard/boxes");
      router.refresh();
    } catch (err) {
      setFormState("error");
      setError(err instanceof Error ? err.message : "作成に失敗しました");
    }
  };

  return (
    <div className="px-6 py-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link href="/dashboard/boxes">
          <Button variant="ghost" size="sm" leftIcon={<ArrowLeft size={15} />}>戻る</Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-primary">質問箱を作成</h1>
        </div>
      </div>

      {/* Form */}
      <div className="rounded-2xl p-8 bg-surface border border-border">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <Input
            label="タイトル（必須）"
            placeholder="なんでも質問してください！"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            helper="質問箱に表示されるタイトルです"
            maxLength={100}
            required
            disabled={formState === "submitting"}
          />

          <Textarea
            label="説明文"
            placeholder="どんな質問でも歓迎です。匿名で送ってね。"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            helper="任意。質問箱のページに表示される説明文です。"
            maxLength={300}
            showCount
            rows={4}
            disabled={formState === "submitting"}
          />

          {/* Toggle: isOpen */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted">質問の受付</p>
              <p className="text-xs mt-0.5 text-subtle">オフにすると新しい質問を受け付けません</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={isOpen}
              onClick={() => setIsOpen((v) => !v)}
              className={cn(
                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/40 border border-border",
                isOpen ? "bg-accent" : "bg-elevated"
              )}
              disabled={formState === "submitting"}
            >
              <span
                className="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200"
                style={{ transform: isOpen ? "translateX(22px)" : "translateX(2px)" }}
              />
            </button>
          </div>

          {error && (
            <div className="rounded-lg p-3 flex items-center gap-2 text-sm bg-red-400/8 border border-red-400/25 text-error">
              <AlertCircle size={15} />
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <Link href="/dashboard/boxes">
              <Button variant="ghost" type="button" disabled={formState === "submitting"}>
                キャンセル
              </Button>
            </Link>
            <Button
              type="submit"
              loading={formState === "submitting"}
              disabled={!title.trim()}
              leftIcon={<Plus size={16} />}
            >
              作成する
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
