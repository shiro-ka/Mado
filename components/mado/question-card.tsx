import Link from "next/link";
import { MessageCircle, Lock, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
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
        className={cn(
          "rounded-xl p-4 transition-all duration-200 group-hover:border-violet-700/40 bg-surface",
          question.isRead ? "border border-border" : "border border-violet-700/35"
        )}
      >
        <div className="flex items-start gap-3">
          {/* Unread indicator */}
          <div className="mt-1 shrink-0">
            {question.isRead ? (
              <CheckCircle2 size={16} className="text-subtle" />
            ) : (
              <div className="w-2 h-2 rounded-full mt-1.5 bg-accent" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {!question.isRead && (
                <Badge variant="default" size="sm">未読</Badge>
              )}
              <span className="text-xs ml-auto text-subtle">
                {formatDate(question.createdAt)}
              </span>
            </div>

            {/* Encrypted payload preview or body */}
            <div className="flex items-start gap-2">
              {preview ? (
                <p className="text-sm line-clamp-2 text-primary">
                  {truncate(preview, 120)}
                </p>
              ) : (
                <div className="flex items-center gap-1.5">
                  <Lock size={12} className="text-subtle" />
                  <span className="text-sm italic text-subtle">暗号化されたメッセージ</span>
                </div>
              )}
            </div>

            {/* Sender info */}
            {question.senderHandle && (
              <div className="flex items-center gap-1.5 mt-2">
                <MessageCircle size={12} className="text-subtle" />
                <span className="text-xs text-muted">@{question.senderHandle}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
