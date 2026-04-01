import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, User, ExternalLink, Trash2, Ban, Lock } from "lucide-react";
import { requireSession, getTokens } from "@/lib/auth";
import { getRedis, Keys } from "@/lib/redis";
import { decryptFromBase64 } from "@/lib/crypto";
import { getProfile } from "@/lib/atproto";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { formatDateFull } from "@/lib/utils";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function QuestionDetailPage({ params }: Props) {
  const session = await requireSession();
  const { id: rkey } = await params;

  // Fetch the question record from the user's PDS
  // For now, we need to find it via list
  const { listQuestions } = await import("@/lib/atproto");
  const questions = await listQuestions(session.did);
  const question = questions.find((q) => q.rkey === rkey);

  if (!question) {
    notFound();
  }

  // Decrypt the question body using the stored private key
  let decryptedBody: string | null = null;
  let senderDid: string | null = null;
  let decryptError = false;

  try {
    const redis = getRedis();
    const privateKeyHex = await redis.get<string>(
      Keys.keyPair(session.did, question.boxRkey)
    );

    if (privateKeyHex) {
      const payload = decryptFromBase64(privateKeyHex, question.encryptedPayload);
      decryptedBody = payload.body;
      senderDid = payload.from;
    }
  } catch {
    decryptError = true;
  }

  // Fetch sender's profile if we have their DID
  const senderProfile = senderDid ? await getProfile(senderDid) : null;

  return (
    <div className="px-6 py-8 max-w-2xl mx-auto">
      {/* Back */}
      <div className="mb-8">
        <Link href="/dashboard/questions">
          <Button variant="ghost" size="sm" leftIcon={<ArrowLeft style={{ width: 15, height: 15 }} />}>
            受信トレイに戻る
          </Button>
        </Link>
      </div>

      {/* Question card */}
      <div
        className="rounded-2xl p-6 mb-5"
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border)",
        }}
      >
        {/* Status */}
        <div className="flex items-center justify-between mb-4">
          <Badge variant={question.isRead ? "muted" : "default"} dot>
            {question.isRead ? "既読" : "未読"}
          </Badge>
          <span className="text-xs" style={{ color: "var(--text-subtle)" }}>
            {formatDateFull(question.createdAt)}
          </span>
        </div>

        {/* Decrypted content */}
        <div className="mb-5">
          {decryptedBody ? (
            <p
              className="text-base leading-relaxed whitespace-pre-wrap"
              style={{ color: "var(--text-primary)" }}
            >
              {decryptedBody}
            </p>
          ) : decryptError ? (
            <div
              className="rounded-lg p-4 flex items-center gap-2"
              style={{
                background: "rgba(248, 113, 113, 0.08)",
                border: "1px solid rgba(248, 113, 113, 0.2)",
              }}
            >
              <Lock style={{ width: 15, height: 15, color: "var(--error)" }} />
              <p className="text-sm" style={{ color: "var(--error)" }}>
                復号に失敗しました。鍵が見つかりません。
              </p>
            </div>
          ) : (
            <div
              className="rounded-lg p-4 flex items-center gap-2"
              style={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--border)",
              }}
            >
              <Lock style={{ width: 15, height: 15, color: "var(--text-subtle)" }} />
              <p className="text-sm" style={{ color: "var(--text-subtle)" }}>
                秘密鍵が見つかりません
              </p>
            </div>
          )}
        </div>

        {/* Sender info */}
        <div
          className="pt-4 flex items-center gap-3"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          {senderProfile?.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={senderProfile.avatar}
              alt={senderProfile.handle}
              className="w-9 h-9 rounded-full object-cover shrink-0"
            />
          ) : (
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
              style={{ background: "var(--bg-elevated)" }}
            >
              <User style={{ width: 16, height: 16, color: "var(--text-subtle)" }} />
            </div>
          )}
          <div className="flex-1 min-w-0">
            {senderProfile ? (
              <>
                <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                  {senderProfile.displayName ?? senderProfile.handle}
                </p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  @{senderProfile.handle}
                </p>
              </>
            ) : senderDid ? (
              <p className="text-xs font-mono" style={{ color: "var(--text-subtle)" }}>
                {senderDid}
              </p>
            ) : (
              <p className="text-sm" style={{ color: "var(--text-subtle)" }}>
                送信者情報なし
              </p>
            )}
          </div>
          {senderProfile && (
            <a
              href={`https://bsky.app/profile/${senderProfile.handle}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="ghost" size="sm">
                <ExternalLink style={{ width: 13, height: 13 }} />
              </Button>
            </a>
          )}
        </div>
      </div>

      {/* Answer form */}
      <div
        className="rounded-2xl p-6 mb-5"
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border)",
        }}
      >
        <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
          回答を書く
        </h2>
        <form className="flex flex-col gap-4">
          <Textarea
            placeholder="回答を入力してください..."
            rows={4}
            maxLength={1000}
            showCount
          />
          <div className="flex justify-end">
            <Button type="submit">
              回答を投稿
            </Button>
          </div>
        </form>
      </div>

      {/* Danger zone */}
      <div
        className="rounded-2xl p-5 flex flex-col sm:flex-row gap-3"
        style={{
          background: "rgba(248, 113, 113, 0.05)",
          border: "1px solid rgba(248, 113, 113, 0.15)",
        }}
      >
        <Button
          variant="destructive"
          size="sm"
          leftIcon={<Trash2 style={{ width: 14, height: 14 }} />}
          className="flex-1 sm:flex-none"
        >
          削除
        </Button>
        {senderDid && (
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Ban style={{ width: 14, height: 14 }} />}
            className="flex-1 sm:flex-none"
          >
            送信者をブロック
          </Button>
        )}
      </div>
    </div>
  );
}
