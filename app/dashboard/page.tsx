import Link from "next/link";
import { MessageSquare, Inbox, ChevronRight, Plus, AlertTriangle } from "lucide-react";
import { requireSession, getSessionTtl } from "@/lib/auth";
import { listBoxes, listQuestions } from "@/lib/atproto";
import { getRedis, Keys } from "@/lib/redis";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default async function DashboardPage() {
  const session = await requireSession();

  const redis = getRedis();
  const [boxes, questionsRaw, readRkeysArr, sessionTtl] = await Promise.all([
    listBoxes(session.did),
    listQuestions(session.did),
    redis.smembers<string[]>(Keys.read(session.did)),
    getSessionTtl(),
  ]);

  // Warn when fewer than 7 days remain in the mado session
  const SESSION_WARN_SECONDS = 7 * 24 * 60 * 60;
  const sessionExpiringSoon = sessionTtl !== null && sessionTtl < SESSION_WARN_SECONDS;
  const sessionDaysLeft = sessionTtl !== null ? Math.ceil(sessionTtl / (24 * 60 * 60)) : null;
  const readRkeys = new Set(readRkeysArr);
  const questions = questionsRaw.map((q) => ({ ...q, isRead: readRkeys.has(q.rkey) }));

  const unreadCount = questions.filter((q) => !q.isRead).length;
  const openBoxCount = boxes.filter((b) => b.isOpen).length;

  return (
    <div className="px-6 py-8 max-w-4xl mx-auto">
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>
          おかえりなさい、{session.displayName ?? `@${session.handle}`}
        </h1>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          今日も窓から声が届いていますよ
        </p>
      </div>

      {/* Session expiry warning */}
      {sessionExpiringSoon && (
        <div
          className="mb-6 rounded-xl px-4 py-3 flex items-center gap-3"
          style={{
            background: "rgba(251, 191, 36, 0.08)",
            border: "1px solid rgba(251, 191, 36, 0.3)",
          }}
        >
          <AlertTriangle style={{ width: 16, height: 16, color: "#fbbf24", flexShrink: 0 }} />
          <p className="text-sm flex-1" style={{ color: "#fbbf24" }}>
            セッションがあと{sessionDaysLeft}日で期限切れになります。
          </p>
          <Link
            href="/auth/login"
            className="text-xs font-medium underline"
            style={{ color: "#fbbf24" }}
          >
            再ログイン
          </Link>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          {
            label: "質問箱",
            value: boxes.length,
            sub: `${openBoxCount}件 受付中`,
            color: "#a78bfa",
            bg: "rgba(124, 58, 237, 0.1)",
          },
          {
            label: "未読の質問",
            value: unreadCount,
            sub: `全 ${questions.length}件`,
            color: "#34d399",
            bg: "rgba(52, 211, 153, 0.1)",
          },
          {
            label: "総受信数",
            value: questions.length,
            sub: "累計",
            color: "#60a5fa",
            bg: "rgba(96, 165, 250, 0.1)",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl p-5"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border)",
            }}
          >
            <p className="text-xs font-medium mb-2" style={{ color: "var(--text-muted)" }}>
              {stat.label}
            </p>
            <p
              className="text-3xl font-bold tabular-nums"
              style={{ color: stat.color }}
            >
              {stat.value}
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--text-subtle)" }}>
              {stat.sub}
            </p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Boxes section */}
        <Card variant="default">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <MessageSquare
                style={{ width: 16, height: 16, color: "#a78bfa" }}
              />
              <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                質問箱
              </h2>
            </div>
            <Link href="/dashboard/boxes">
              <Button variant="ghost" size="sm" rightIcon={<ChevronRight style={{ width: 13, height: 13 }} />}>
                すべて見る
              </Button>
            </Link>
          </div>

          {boxes.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm mb-3" style={{ color: "var(--text-muted)" }}>
                まだ質問箱がありません
              </p>
              <Link href="/dashboard/boxes/new">
                <Button size="sm" leftIcon={<Plus style={{ width: 14, height: 14 }} />}>
                  作成する
                </Button>
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {boxes.slice(0, 3).map((box) => (
                <Link
                  key={box.rkey}
                  href={`/dashboard/boxes/${box.rkey}`}
                  className="flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors duration-200 hover:bg-violet-950/20"
                >
                  <span
                    className="text-sm truncate"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {box.title}
                  </span>
                  <span
                    className="text-xs ml-2 shrink-0"
                    style={{
                      color: box.isOpen ? "var(--success)" : "var(--text-subtle)",
                    }}
                  >
                    {box.isOpen ? "受付中" : "停止中"}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </Card>

        {/* Questions section */}
        <Card variant="default">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Inbox style={{ width: 16, height: 16, color: "#34d399" }} />
              <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                受信トレイ
              </h2>
              {unreadCount > 0 && (
                <span
                  className="text-xs px-1.5 py-0.5 rounded-full font-bold"
                  style={{ background: "var(--accent)", color: "white" }}
                >
                  {unreadCount}
                </span>
              )}
            </div>
            <Link href="/dashboard/questions">
              <Button variant="ghost" size="sm" rightIcon={<ChevronRight style={{ width: 13, height: 13 }} />}>
                すべて見る
              </Button>
            </Link>
          </div>

          {questions.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                まだ質問が届いていません
              </p>
              <p className="text-xs mt-1" style={{ color: "var(--text-subtle)" }}>
                質問箱のURLをシェアしましょう
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {questions.slice(0, 4).map((q) => (
                <Link
                  key={q.rkey}
                  href={`/dashboard/questions/${q.rkey}`}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg transition-colors duration-200 hover:bg-violet-950/20"
                >
                  {!q.isRead && (
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ background: "var(--accent)" }}
                    />
                  )}
                  <span
                    className="text-sm truncate"
                    style={{ color: "var(--text-muted)" }}
                  >
                    暗号化メッセージ
                  </span>
                  <span
                    className="text-xs ml-auto shrink-0 tabular-nums"
                    style={{ color: "var(--text-subtle)" }}
                  >
                    {new Date(q.createdAt).toLocaleDateString("ja-JP")}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
