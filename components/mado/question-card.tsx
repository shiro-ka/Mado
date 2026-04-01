import Link from "next/link";
import { MessageCircle, Lock, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDate, truncate } from "@/lib/utils";
import type { Question } from "@/types";

interface QuestionCardProps {
  question: Question;
  preview?: string;
}

export function QuestionCard({ question, preview }: QuestionCardProps) {
  const href = `/dashboard/questions/${question.rkey}`;

  return (
    <Link href={href} className="group block">
      <div
        className="rounded-xl p-4 transition-all duration-200 group-hover:border-violet-700/40"
        style={{
          background: "var(--bg-surface)",
          border: `1px solid ${question.isRead ? "var(--border)" : "rgba(139, 92, 246, 0.35)"}`,
        }}
      >
        <div className="flex items-start gap-3">
          {/* Unread indicator */}
          <div className="mt-1 shrink-0">
            {question.isRead ? (
              <CheckCircle2
                style={{ width: 16, height: 16, color: "var(--text-subtle)" }}
              />
            ) : (
              <div
                className="w-2 h-2 rounded-full mt-1.5"
                style={{ background: "var(--accent)" }}
              />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {!question.isRead && (
                <Badge variant="default" size="sm">
                  未読
                </Badge>
              )}
              <span
                className="text-xs ml-auto"
                style={{ color: "var(--text-subtle)" }}
              >
                {formatDate(question.createdAt)}
              </span>
            </div>

            {/* Encrypted payload preview or body */}
            <div className="flex items-start gap-2">
              {preview ? (
                <p
                  className="text-sm line-clamp-2"
                  style={{ color: "var(--text-primary)" }}
                >
                  {truncate(preview, 120)}
                </p>
              ) : (
                <div className="flex items-center gap-1.5">
                  <Lock
                    style={{ width: 12, height: 12, color: "var(--text-subtle)" }}
                  />
                  <span
                    className="text-sm italic"
                    style={{ color: "var(--text-subtle)" }}
                  >
                    暗号化されたメッセージ
                  </span>
                </div>
              )}
            </div>

            {/* Sender info */}
            {question.senderHandle && (
              <div className="flex items-center gap-1.5 mt-2">
                <MessageCircle
                  style={{ width: 12, height: 12, color: "var(--text-subtle)" }}
                />
                <span
                  className="text-xs"
                  style={{ color: "var(--text-muted)" }}
                >
                  @{question.senderHandle}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
