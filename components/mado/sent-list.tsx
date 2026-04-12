"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp, Send, MessageCircle, Clock } from "lucide-react";
import type { SentRef, Answer } from "@/types";
import { formatDateFull } from "@/lib/utils";

export interface SentItem {
  ref: SentRef;
  koeUri: string;
  answers: Answer[];
  isRead: boolean;
}

interface Props {
  items: SentItem[];
}

type Tab = "all" | "unread" | "read";

export function SentList({ items }: Props) {
  const [tab, setTab] = React.useState<Tab>("all");
  const [expanded, setExpanded] = React.useState<Set<string>>(new Set());
  const [readSet, setReadSet] = React.useState<Set<string>>(
    new Set(items.filter((i) => i.isRead).map((i) => `${i.ref.ownerDid}:${i.ref.koeRkey}`))
  );

  const filtered = items.filter((item) => {
    const hasAnswer = item.answers.length > 0;
    const isRead = readSet.has(`${item.ref.ownerDid}:${item.ref.koeRkey}`);
    if (tab === "unread") return hasAnswer && !isRead;
    if (tab === "read") return hasAnswer && isRead;
    return true;
  });

  const unreadCount = items.filter((i) => {
    return i.answers.length > 0 && !readSet.has(`${i.ref.ownerDid}:${i.ref.koeRkey}`);
  }).length;

  const markRead = async (ownerDid: string, koeRkey: string) => {
    const key = `${ownerDid}:${koeRkey}`;
    if (readSet.has(key)) return;
    setReadSet((prev) => new Set([...prev, key]));
    await fetch("/api/sent/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ownerDid, koeRkey }),
    }).catch(() => {});
  };

  const toggle = (key: string, ownerDid: string, koeRkey: string, hasAnswer: boolean) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
        if (hasAnswer) markRead(ownerDid, koeRkey);
      }
      return next;
    });
  };

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: "all", label: "すべて", count: items.length },
    { id: "unread", label: "未読", count: unreadCount },
    { id: "read", label: "既読" },
  ];

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-1 mb-5 p-1 rounded-xl bg-elevated">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200",
              tab === t.id
                ? "bg-surface text-primary shadow-[0_1px_3px_rgba(0,0,0,0.2)]"
                : "bg-transparent text-subtle"
            )}
          >
            {t.label}
            {t.count !== undefined && t.count > 0 && (
              <span
                className={cn(
                  "text-xs px-1.5 py-0.5 rounded-full",
                  t.id === "unread" && tab !== "unread"
                    ? "bg-accent text-white"
                    : "bg-elevated text-subtle"
                )}
              >
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-elevated">
            {tab === "unread" ? (
              <MessageCircle size={22} className="text-subtle" />
            ) : (
              <Send size={22} className="text-subtle" />
            )}
          </div>
          <p className="text-sm text-subtle">
            {tab === "unread" ? "未読の返信はありません" : tab === "read" ? "既読の返信はありません" : "まだ質問を送っていません"}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((item) => {
            const key = `${item.ref.ownerDid}:${item.ref.koeRkey}`;
            const isExpanded = expanded.has(key);
            const hasAnswer = item.answers.length > 0;
            const isRead = readSet.has(key);

            return (
              <div
                key={key}
                className={cn(
                  "rounded-2xl overflow-hidden bg-surface",
                  hasAnswer && !isRead ? "border border-blue-600/40" : "border border-border"
                )}
              >
                {/* Header */}
                <button
                  onClick={() => toggle(key, item.ref.ownerDid, item.ref.koeRkey, hasAnswer)}
                  className="w-full text-left p-5 flex flex-col gap-3"
                >
                  {/* Meta row */}
                  <div className="flex items-center gap-2">
                    <Clock size={12} className="text-subtle" />
                    <span className="text-xs text-subtle">{formatDateFull(item.ref.sentAt)}</span>
                    <div className="flex-1" />
                    {hasAnswer && (
                      <span
                        className={cn(
                          "text-xs px-2 py-0.5 rounded-full font-medium",
                          isRead
                            ? "bg-elevated text-subtle border border-border"
                            : "bg-blue-600/15 text-blue-400 border border-blue-600/30"
                        )}
                      >
                        {isRead ? "返信済み" : "返信あり"}
                      </span>
                    )}
                    {isExpanded ? (
                      <ChevronUp size={15} className="text-subtle" />
                    ) : (
                      <ChevronDown size={15} className="text-subtle" />
                    )}
                  </div>

                  {/* Question body */}
                  <p
                    className={cn(
                      "text-sm leading-relaxed whitespace-pre-wrap text-primary",
                      !isExpanded && "line-clamp-2"
                    )}
                  >
                    {item.ref.body}
                  </p>
                </button>

                {/* Answers */}
                {isExpanded && hasAnswer && (
                  <div className="px-5 pb-5 flex flex-col gap-3 border-t border-border">
                    <p className="text-xs font-medium pt-4 text-subtle">
                      返信（{item.answers.length}件）
                    </p>
                    {item.answers.map((answer) => (
                      <div key={answer.rkey} className="rounded-xl p-4 bg-elevated">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-5 h-5 rounded-full flex items-center justify-center bg-accent-light">
                            <MessageCircle size={10} className="text-accent" />
                          </div>
                          <span className="text-xs text-muted">{formatDateFull(answer.createdAt)}</span>
                        </div>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap text-primary">
                          {answer.body}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {isExpanded && !hasAnswer && (
                  <div className="px-5 pb-5 pt-4 border-t border-border">
                    <p className="text-sm text-subtle">まだ返信がありません</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
