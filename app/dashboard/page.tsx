import Link from "next/link";
import { MessageSquare, Inbox, ChevronRight, Plus, AlertTriangle } from "lucide-react";
import { requireSession, getSessionTtl } from "@/lib/auth";
import { listBoxes, listQuestions } from "@/lib/atproto";
import { getRedis, Keys } from "@/lib/redis";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default async function DashboardPage() {
  const session = await requireSession();

  const redis = getRedis();
  const [boxes, questionsRaw, readRkeysArr, sessionTtl] = await Promise.all([
    listBoxes(session.did),
    listQuestions(session.did),
    redis.smembers<string[]>(Keys.read(session.did)),
    getSessionTtl(),
  ]);

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
        <h1 className="text-2xl font-bold mb-1 text-primary">
          おかえりなさい、{session.displayName ?? `@${session.handle}`}
        </h1>
        <p className="text-sm text-muted">今日も窓から声が届いていますよ</p>
      </div>

      {/* Session expiry warning */}
      {sessionExpiringSoon && (
        <div className="mb-6 rounded-xl px-4 py-3 flex items-center gap-3 bg-amber-400/8 border border-amber-400/30">
          <AlertTriangle size={16} className="text-amber-400 shrink-0" />
          <p className="text-sm flex-1 text-amber-400">
            セッションがあと{sessionDaysLeft}日で期限切れになります。
          </p>
          <Link href="/auth/login" className="text-xs font-medium underline text-amber-400">
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
            color: "text-blue-400",
            bg: "bg-blue-600/10",
          },
          {
            label: "未読の質問",
            value: unreadCount,
            sub: `全 ${questions.length}件`,
            color: "text-emerald-400",
            bg: "bg-emerald-400/10",
          },
          {
            label: "総受信数",
            value: questions.length,
            sub: "累計",
            color: "text-blue-400",
            bg: "bg-blue-400/10",
          },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl p-5 bg-surface border border-border">
            <p className="text-xs font-medium mb-2 text-muted">{stat.label}</p>
            <p className={cn("text-3xl font-bold tabular-nums", stat.color)}>{stat.value}</p>
            <p className="text-xs mt-1 text-subtle">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Boxes section */}
        <Card variant="default">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <MessageSquare size={16} className="text-blue-400" />
              <h2 className="text-sm font-semibold text-primary">質問箱</h2>
            </div>
            <Link href="/dashboard/boxes">
              <Button variant="ghost" size="sm" rightIcon={<ChevronRight size={13} />}>
                すべて見る
              </Button>
            </Link>
          </div>

          {boxes.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm mb-3 text-muted">まだ質問箱がありません</p>
              <Link href="/dashboard/boxes/new">
                <Button size="sm" leftIcon={<Plus size={14} />}>作成する</Button>
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {boxes.slice(0, 3).map((box) => (
                <Link
                  key={box.rkey}
                  href={`/dashboard/boxes/${box.rkey}`}
                  className="flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors duration-200 hover:bg-blue-950/20"
                >
                  <span className="text-sm truncate text-primary">{box.title}</span>
                  <span className={cn("text-xs ml-2 shrink-0", box.isOpen ? "text-success" : "text-subtle")}>
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
              <Inbox size={16} className="text-emerald-400" />
              <h2 className="text-sm font-semibold text-primary">受信トレイ</h2>
              {unreadCount > 0 && (
                <span className="text-xs px-1.5 py-0.5 rounded-full font-bold bg-accent text-white">
                  {unreadCount}
                </span>
              )}
            </div>
            <Link href="/dashboard/questions">
              <Button variant="ghost" size="sm" rightIcon={<ChevronRight size={13} />}>
                すべて見る
              </Button>
            </Link>
          </div>

          {questions.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-muted">まだ質問が届いていません</p>
              <p className="text-xs mt-1 text-subtle">質問箱のURLをシェアしましょう</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {questions.slice(0, 4).map((q) => (
                <Link
                  key={q.rkey}
                  href={`/dashboard/questions/${q.rkey}`}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg transition-colors duration-200 hover:bg-blue-950/20"
                >
                  {!q.isRead && (
                    <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-accent" />
                  )}
                  <span className="text-sm truncate text-muted">{q.body}</span>
                  <span className="text-xs ml-auto shrink-0 tabular-nums text-subtle">
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
