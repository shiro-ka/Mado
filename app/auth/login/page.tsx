"use client";

import * as React from "react";
import Link from "next/link";
import { MessageCircle, AtSign, AlertCircle, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const [handle, setHandle] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!handle.trim()) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handle: handle.trim().replace(/^@/, "") }),
      });

      const data = await res.json() as { redirectUrl?: string; error?: string; message?: string };

      if (!res.ok) {
        throw new Error(data.message ?? data.error ?? "ログインに失敗しました");
      }

      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "ログインに失敗しました");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-4 py-16 bg-background">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-accent">
              <MessageCircle size={20} className="text-white" />
            </div>
            <span className="font-bold text-xl text-primary">Mado</span>
          </Link>
          <h1 className="text-2xl font-bold text-center text-primary">
            Blueskyアカウントでログイン
          </h1>
          <p className="text-sm text-center text-muted">
            あなたのハンドルを入力して認証します
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-8 bg-surface border border-border">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <Input
              label="Blueskyハンドル"
              placeholder="yourname.bsky.social"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              leftAddon={<AtSign size={16} />}
              helper="例：alice.bsky.social または alice.com"
              disabled={loading}
              autoFocus
              autoComplete="username"
              inputMode="email"
            />

            {error && (
              <div className="rounded-lg p-3 flex items-center gap-2 text-sm bg-red-400/8 border border-red-400/25 text-error">
                <AlertCircle size={15} />
                {error}
              </div>
            )}

            <Button
              type="submit"
              size="lg"
              loading={loading}
              disabled={!handle.trim()}
              className="w-full"
            >
              {loading ? "認証中..." : "ログインする"}
            </Button>
          </form>

          <div className="mt-5 pt-5 flex items-start gap-2.5 border-t border-border">
            <Shield size={14} className="shrink-0 mt-0.5 text-subtle" />
            <p className="text-xs leading-relaxed text-subtle">
              認証にはATProtocol OAuth 2.0を使用します。
              パスワードはMadoに送信されません。
              認証後、あなたのDIDとハンドルが質問に紐付けられます。
            </p>
          </div>
        </div>

        <p className="text-center text-xs mt-6 text-subtle">
          <Link href="/" className="hover:opacity-80 transition-opacity">
            ← トップページに戻る
          </Link>
        </p>
      </div>
    </div>
  );
}
