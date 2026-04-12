"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, AlertCircle, Loader2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type FormState = "loading" | "idle" | "submitting" | "error" | "deleting";

interface BoxData {
  rkey: string;
  title: string;
  description?: string;
  isOpen: boolean;
  slug: string;
  createdAt: string;
}

export default function EditBoxPage() {
  const params = useParams();
  const router = useRouter();
  const rkey = params.slug as string;

  const [formState, setFormState] = React.useState<FormState>("loading");
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [isOpen, setIsOpen] = React.useState(true);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    const loadBox = async () => {
      try {
        const res = await fetch(`/api/boxes/${rkey}`);
        if (!res.ok) throw new Error("Not found");
        const data = await res.json() as BoxData;
        setTitle(data.title);
        setDescription(data.description ?? "");
        setIsOpen(data.isOpen);
        setFormState("idle");
      } catch {
        setError("質問箱の読み込みに失敗しました");
        setFormState("error");
      }
    };
    loadBox();
  }, [rkey]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || formState === "submitting") return;

    setFormState("submitting");
    setError("");

    try {
      const res = await fetch(`/api/boxes/${rkey}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          isOpen,
        }),
      });

      if (!res.ok) {
        const data = await res.json() as { message?: string };
        throw new Error(data.message ?? "更新に失敗しました");
      }

      router.push("/dashboard/boxes");
      router.refresh();
    } catch (err) {
      setFormState("error");
      setError(err instanceof Error ? err.message : "更新に失敗しました");
    }
  };

  const handleDelete = async () => {
    if (!confirm("この質問箱を削除しますか？この操作は取り消せません。")) return;

    setFormState("deleting");
    setError("");

    try {
      const res = await fetch(`/api/boxes/${rkey}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json() as { message?: string };
        throw new Error(data.message ?? "削除に失敗しました");
      }
      router.push("/dashboard/boxes");
      router.refresh();
    } catch (err) {
      setFormState("idle");
      setError(err instanceof Error ? err.message : "削除に失敗しました");
    }
  };

  if (formState === "loading") {
    return (
      <div className="px-6 py-8 max-w-2xl mx-auto flex items-center justify-center min-h-64">
        <Loader2 size={28} className="animate-spin text-subtle" />
      </div>
    );
  }

  return (
    <div className="px-6 py-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link href="/dashboard/boxes">
          <Button variant="ghost" size="sm" leftIcon={<ArrowLeft size={15} />}>戻る</Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-primary">質問箱を編集</h1>
        </div>
      </div>

      {/* Form */}
      <div className="rounded-2xl p-8 bg-surface border border-border">
        <form onSubmit={handleSave} className="flex flex-col gap-6">
          <Input
            label="タイトル（必須）"
            placeholder="なんでも質問してください！"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={100}
            required
            disabled={formState === "submitting" || formState === "deleting"}
          />

          <Textarea
            label="説明文"
            placeholder="どんな質問でも歓迎です。"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={300}
            showCount
            rows={4}
            disabled={formState === "submitting" || formState === "deleting"}
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
                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 cursor-pointer border border-border",
                isOpen ? "bg-accent" : "bg-elevated"
              )}
              disabled={formState === "submitting" || formState === "deleting"}
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

          <div className="flex items-center justify-between gap-3 pt-2">
            <Button
              type="button"
              variant="destructive"
              size="sm"
              loading={formState === "deleting"}
              leftIcon={<Trash2 size={14} />}
              onClick={handleDelete}
            >
              削除
            </Button>

            <div className="flex items-center gap-3">
              <Link href="/dashboard/boxes">
                <Button variant="ghost" type="button" disabled={formState === "submitting"}>
                  キャンセル
                </Button>
              </Link>
              <Button
                type="submit"
                loading={formState === "submitting"}
                disabled={!title.trim()}
                leftIcon={<Save size={16} />}
              >
                保存する
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
