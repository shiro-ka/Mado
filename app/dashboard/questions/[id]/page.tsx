import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, User, ExternalLink, Lock } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { getRedis, Keys } from "@/lib/redis";
import { decryptDid } from "@/lib/crypto";
import { getProfile } from "@/lib/atproto";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AnswerForm } from "@/components/mado/answer-form";
import { BlockButton } from "@/components/mado/block-button";
import { DeleteQuestionButton } from "@/components/mado/delete-question-button";
import { formatDateFull } from "@/lib/utils";
import { MessageCircle } from "lucide-react";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function QuestionDetailPage({ params }: Props) {
  const session = await requireSession();
  const { id: rkey } = await params;

  const { getKoeRecord, listAnswers } = await import("@/lib/atproto");
  const koeUri = `at://${session.did}/blue.mado.koe/${rkey}`;
  const [question, answers] = await Promise.all([
    getKoeRecord(session.did, rkey),
    listAnswers(session.did, koeUri),
  ]);

  if (!question) {
    notFound();
  }

  // body is plaintext (spec v3); decrypt only encryptedFrom to reveal sender's DID
  const decryptedBody = question.body;
  let senderDid: string | null = null;
  let decryptError = false;

  try {
    const redis = getRedis();
    // Mark this question as read
    await redis.sadd(Keys.read(session.did), rkey);

    // keyPair is keyed by boxRkey, which we can extract from the boxUri
    const boxRkey = question.boxUri.split("/").pop() ?? "";
    const privateKeyHex = await redis.get<string>(
      Keys.keyPair(session.did, boxRkey)
    );

    if (privateKeyHex) {
      senderDid = decryptDid(privateKeyHex, question.encryptedFrom);
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

        {/* Question body (plaintext per spec v3) */}
        <div className="mb-5">
          <p
            className="text-base leading-relaxed whitespace-pre-wrap"
            style={{ color: "var(--text-primary)" }}
          >
            {decryptedBody}
          </p>
        </div>

        {/* Sender DID decryption status */}
        {decryptError && (
          <div
            className="mb-4 rounded-lg p-3 flex items-center gap-2"
            style={{
              background: "rgba(248, 113, 113, 0.08)",
              border: "1px solid rgba(248, 113, 113, 0.2)",
            }}
          >
            <Lock style={{ width: 14, height: 14, color: "var(--error)" }} />
            <p className="text-sm" style={{ color: "var(--error)" }}>
              送信者の特定に失敗しました。秘密鍵が見つかりません。
            </p>
          </div>
        )}

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

      {/* Existing answers */}
      {answers.length > 0 && (
        <div className="mb-5 flex flex-col gap-3">
          <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            回答済み（{answers.length}件）
          </h2>
          {answers.map((answer) => (
            <div
              key={answer.rkey}
              className="rounded-2xl p-5"
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border)",
              }}
            >
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: "var(--accent-light)" }}
                >
                  <MessageCircle style={{ width: 12, height: 12, color: "var(--accent)" }} />
                </div>
                <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                  あなたの回答
                </span>
                <span className="text-xs ml-auto" style={{ color: "var(--text-subtle)" }}>
                  {formatDateFull(answer.createdAt)}
                </span>
              </div>
              <p
                className="text-sm leading-relaxed whitespace-pre-wrap"
                style={{ color: "var(--text-primary)" }}
              >
                {answer.body}
              </p>
            </div>
          ))}
        </div>
      )}

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
        <AnswerForm
          koeUri={koeUri}
        />
      </div>

      {/* Danger zone */}
      <div
        className="rounded-2xl p-5 flex flex-col sm:flex-row gap-3"
        style={{
          background: "rgba(248, 113, 113, 0.05)",
          border: "1px solid rgba(248, 113, 113, 0.15)",
        }}
      >
        <DeleteQuestionButton rkey={rkey} />
        {senderDid && <BlockButton senderDid={senderDid} />}
      </div>
    </div>
  );
}
