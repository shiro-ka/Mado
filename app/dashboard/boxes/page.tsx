import Link from "next/link";
import { Plus, Edit3, Link2 } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { listBoxes, getProfile } from "@/lib/atproto";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { boxUrl } from "@/lib/utils";

export default async function BoxesPage() {
  const session = await requireSession();
  const [boxes, resolvedProfile] = await Promise.all([
    listBoxes(session.did),
    session.handle.startsWith("did:") ? getProfile(session.did) : null,
  ]);
  const ownerHandle = resolvedProfile?.handle ?? session.handle;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return (
    <div className="px-6 py-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-primary">質問箱</h1>
          <p className="text-sm mt-1 text-muted">{boxes.length}件の質問箱</p>
        </div>
        <Link href="/dashboard/boxes/new">
          <Button leftIcon={<Plus size={16} />}>新しく作成</Button>
        </Link>
      </div>

      {/* Empty state */}
      {boxes.length === 0 && (
        <div className="rounded-2xl p-12 flex flex-col items-center gap-4 text-center bg-surface border border-dashed border-border-strong">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-accent-light">
            <Plus size={24} className="text-violet-400" />
          </div>
          <div>
            <h3 className="font-semibold text-base mb-1 text-primary">質問箱を作成しましょう</h3>
            <p className="text-sm text-muted">
              URLをシェアして、Blueskyのフォロワーから質問を受け付けましょう。
            </p>
          </div>
          <Link href="/dashboard/boxes/new">
            <Button leftIcon={<Plus size={16} />}>最初の質問箱を作成</Button>
          </Link>
        </div>
      )}

      {/* Box list */}
      <div className="flex flex-col gap-4">
        {boxes.map((box) => {
          const publicUrl = `${appUrl}${boxUrl(ownerHandle, box.slug)}`;

          return (
            <div key={box.rkey} className="rounded-xl p-5 bg-surface border border-border">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <h3 className="font-semibold text-base text-primary">{box.title}</h3>
                    <Badge variant={box.isOpen ? "success" : "muted"} dot size="sm">
                      {box.isOpen ? "受付中" : "停止中"}
                    </Badge>
                  </div>

                  {box.description && (
                    <p className="text-sm mb-2 line-clamp-2 text-muted">{box.description}</p>
                  )}

                  <div className="flex items-center gap-1.5">
                    <Link2 size={12} className="text-subtle" />
                    <a
                      href={publicUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs hover:opacity-80 transition-opacity truncate text-violet-400"
                    >
                      {publicUrl}
                    </a>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <Link href={`/dashboard/boxes/${box.rkey}`}>
                    <button
                      className="p-2 rounded-lg transition-colors duration-200 cursor-pointer text-muted"
                      title="編集"
                    >
                      <Edit3 size={15} />
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
