import Link from "next/link";
import { Plus, Edit3, Trash2, Link2, Power, PowerOff } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { listBoxes } from "@/lib/atproto";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { boxUrl } from "@/lib/utils";

export default async function BoxesPage() {
  const session = await requireSession();
  const boxes = await listBoxes(session.did);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return (
    <div className="px-6 py-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            質問箱
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            {boxes.length}件の質問箱
          </p>
        </div>
        <Link href="/dashboard/boxes/new">
          <Button leftIcon={<Plus style={{ width: 16, height: 16 }} />}>
            新しく作成
          </Button>
        </Link>
      </div>

      {/* Empty state */}
      {boxes.length === 0 && (
        <div
          className="rounded-2xl p-12 flex flex-col items-center gap-4 text-center"
          style={{
            background: "var(--bg-surface)",
            border: "1px dashed var(--border-strong)",
          }}
        >
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ background: "var(--accent-light)" }}
          >
            <Plus style={{ width: 24, height: 24, color: "#a78bfa" }} />
          </div>
          <div>
            <h3 className="font-semibold text-base mb-1" style={{ color: "var(--text-primary)" }}>
              質問箱を作成しましょう
            </h3>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              URLをシェアして、Blueskyのフォロワーから質問を受け付けましょう。
            </p>
          </div>
          <Link href="/dashboard/boxes/new">
            <Button leftIcon={<Plus style={{ width: 16, height: 16 }} />}>
              最初の質問箱を作成
            </Button>
          </Link>
        </div>
      )}

      {/* Box list */}
      <div className="flex flex-col gap-4">
        {boxes.map((box) => {
          const publicUrl = `${appUrl}${boxUrl(session.handle, box.slug)}`;

          return (
            <div
              key={box.rkey}
              className="rounded-xl p-5"
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border)",
              }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <h3
                      className="font-semibold text-base"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {box.title}
                    </h3>
                    <Badge variant={box.isOpen ? "success" : "muted"} dot size="sm">
                      {box.isOpen ? "受付中" : "停止中"}
                    </Badge>
                  </div>

                  {box.description && (
                    <p
                      className="text-sm mb-2 line-clamp-2"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {box.description}
                    </p>
                  )}

                  <div className="flex items-center gap-1.5">
                    <Link2
                      style={{ width: 12, height: 12, color: "var(--text-subtle)" }}
                    />
                    <a
                      href={publicUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs hover:opacity-80 transition-opacity truncate"
                      style={{ color: "#a78bfa" }}
                    >
                      {publicUrl}
                    </a>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    className="p-2 rounded-lg transition-colors duration-200 cursor-pointer"
                    style={{ color: "var(--text-subtle)" }}
                    title="URLをコピー"
                    onClick={() => {
                      // Client-side copy — handled by a client wrapper in production
                    }}
                  >
                    <Link2 style={{ width: 15, height: 15 }} />
                  </button>

                  <Link href={`/dashboard/boxes/${box.rkey}`}>
                    <button
                      className="p-2 rounded-lg transition-colors duration-200 cursor-pointer"
                      style={{ color: "var(--text-muted)" }}
                      title="編集"
                    >
                      <Edit3 style={{ width: 15, height: 15 }} />
                    </button>
                  </Link>

                  <button
                    className="p-2 rounded-lg transition-colors duration-200 cursor-pointer"
                    style={{ color: box.isOpen ? "#34d399" : "var(--text-subtle)" }}
                    title={box.isOpen ? "受付を停止する" : "受付を再開する"}
                  >
                    {box.isOpen ? (
                      <Power style={{ width: 15, height: 15 }} />
                    ) : (
                      <PowerOff style={{ width: 15, height: 15 }} />
                    )}
                  </button>

                  <button
                    className="p-2 rounded-lg transition-colors duration-200 cursor-pointer hover:text-red-400"
                    style={{ color: "var(--text-subtle)" }}
                    title="削除"
                  >
                    <Trash2 style={{ width: 15, height: 15 }} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
