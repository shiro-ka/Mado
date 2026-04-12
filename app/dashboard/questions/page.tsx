import Link from "next/link";
import { Inbox, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { requireSession } from "@/lib/auth";
import { listQuestions } from "@/lib/atproto";
import { getRedis, Keys } from "@/lib/redis";
import { QuestionCard } from "@/components/mado/question-card";
import type { FilterTab } from "@/types";

interface Props {
  searchParams: Promise<{ tab?: string }>;
}

export default async function QuestionsPage({ searchParams }: Props) {
  const session = await requireSession();
  const params = await searchParams;
  const tab = (params.tab as FilterTab | undefined) ?? "all";

  const redis = getRedis();
  const [questionsRaw, readRkeysArr] = await Promise.all([
    listQuestions(session.did),
    redis.smembers<string[]>(Keys.read(session.did)),
  ]);
  const readRkeys = new Set(readRkeysArr);
  const allQuestions = questionsRaw.map((q) => ({ ...q, isRead: readRkeys.has(q.rkey) }));

  const filtered = allQuestions.filter((q) => {
    if (tab === "unread") return !q.isRead;
    if (tab === "read") return q.isRead;
    return true;
  });

  const unreadCount = allQuestions.filter((q) => !q.isRead).length;

  const tabs: { key: FilterTab; label: string; count?: number }[] = [
    { key: "all", label: "すべて", count: allQuestions.length },
    { key: "unread", label: "未読", count: unreadCount },
    { key: "read", label: "既読" },
  ];

  return (
    <div className="px-6 py-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary">受信トレイ</h1>
          <p className="text-sm mt-1 text-muted">届いた質問を確認しましょう</p>
        </div>
        <button className="p-2 rounded-lg transition-colors duration-200 cursor-pointer text-subtle" title="更新">
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 p-1 rounded-xl mb-6 w-fit bg-surface">
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={`/dashboard/questions?tab=${t.key}`}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2",
              tab === t.key ? "bg-accent text-white" : "bg-transparent text-muted"
            )}
          >
            {t.label}
            {t.count !== undefined && (
              <span
                className={cn(
                  "text-xs px-1.5 py-0.5 rounded-full tabular-nums",
                  tab === t.key ? "bg-white/20 text-white" : "bg-elevated text-subtle"
                )}
              >
                {t.count}
              </span>
            )}
          </Link>
        ))}
      </div>

      {/* Question list */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl p-12 flex flex-col items-center gap-4 text-center bg-surface border border-dashed border-border-strong">
          <Inbox size={36} className="text-subtle opacity-50" />
          <div>
            <p className="font-semibold text-base text-primary">
              {tab === "unread" ? "未読の質問はありません" : "質問がありません"}
            </p>
            <p className="text-sm mt-1 text-muted">
              {tab === "all"
                ? "質問箱のURLをシェアして質問を募りましょう"
                : "すべての質問を確認しました！"}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((question) => (
            <QuestionCard key={question.rkey} question={question} preview={question.body} />
          ))}
        </div>
      )}
    </div>
  );
}
