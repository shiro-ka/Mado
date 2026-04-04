"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function DashboardError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4">
      <div className="text-center max-w-sm">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
          style={{ background: "rgba(248, 113, 113, 0.1)" }}
        >
          <AlertTriangle style={{ width: 24, height: 24, color: "#f87171" }} />
        </div>
        <h2
          className="text-lg font-semibold mb-2"
          style={{ color: "var(--text-primary)" }}
        >
          エラーが発生しました
        </h2>
        <p
          className="text-sm mb-8 leading-relaxed"
          style={{ color: "var(--text-muted)" }}
        >
          ページの読み込み中に問題が起きました。再試行するか、ダッシュボードのトップに戻ってください。
        </p>
        <div className="flex gap-3 justify-center">
          <Button onClick={reset}>再試行</Button>
          <Link href="/dashboard">
            <Button variant="outline">ダッシュボードに戻る</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
