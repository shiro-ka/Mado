import Link from "next/link";
import { MessageCircle, ChevronRight, Lock, Unlock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { boxUrl } from "@/lib/utils";
import type { QuestionBox } from "@/types";

interface QuestionBoxCardProps {
  box: QuestionBox;
  ownerHandle: string;
  questionCount?: number;
}

export function QuestionBoxCard({
  box,
  ownerHandle,
  questionCount,
}: QuestionBoxCardProps) {
  const href = boxUrl(ownerHandle, box.slug);

  return (
    <Link href={href} className="group block">
      <div className="rounded-xl p-5 transition-all duration-200 group-hover:scale-[1.01] bg-surface border border-border hover:border-border-strong">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="mt-0.5 w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors duration-200 bg-accent-light">
              <MessageCircle size={16} className="text-blue-400" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-sm leading-snug truncate text-primary">
                {box.title}
              </h3>
              {box.description && (
                <p className="text-xs mt-1 line-clamp-2 text-muted">
                  {box.description}
                </p>
              )}
            </div>
          </div>

          <ChevronRight
            size={16}
            className="shrink-0 mt-0.5 opacity-40 group-hover:opacity-80 transition-opacity duration-200 text-subtle"
          />
        </div>

        <div className="flex items-center gap-2 mt-3">
          <Badge variant={box.isOpen ? "success" : "muted"} dot>
            {box.isOpen ? "受付中" : "受付停止"}
          </Badge>
          {box.isOpen ? (
            <span className="text-subtle">
              <Unlock size={12} />
            </span>
          ) : (
            <span className="text-subtle">
              <Lock size={12} />
            </span>
          )}
          {questionCount !== undefined && (
            <span className="text-xs ml-auto text-subtle">
              質問 {questionCount}件
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
