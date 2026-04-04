"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="ja">
      <body>
        <div
          style={{
            minHeight: "100dvh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
            background: "#0a0a0f",
          }}
        >
          <div style={{ textAlign: "center", maxWidth: "24rem" }}>
            <p
              style={{
                fontSize: "4rem",
                fontWeight: 700,
                marginBottom: "1rem",
                color: "#f87171",
              }}
            >
              500
            </p>
            <h1
              style={{
                fontSize: "1.125rem",
                fontWeight: 600,
                marginBottom: "0.5rem",
                color: "#e8e0ff",
              }}
            >
              予期しないエラーが発生しました
            </h1>
            <p
              style={{
                fontSize: "0.875rem",
                marginBottom: "2rem",
                color: "#9ca3af",
                lineHeight: 1.6,
              }}
            >
              しばらく待ってから再試行してください。
            </p>
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
              <Button onClick={reset}>再試行</Button>
              <Link href="/">
                <Button variant="outline">トップに戻る</Button>
              </Link>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
