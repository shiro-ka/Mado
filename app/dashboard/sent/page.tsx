import type { Metadata } from "next";
import { Send } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { getRedis, Keys } from "@/lib/redis";
import { getAnswersByOwner } from "@/lib/atproto";
import { SentList } from "@/components/mado/sent-list";
import type { SentRef } from "@/types";

export const metadata: Metadata = { title: "送信トレイ" };

export default async function SentPage() {
  const session = await requireSession();
  const redis = getRedis();

  const sentRefs = await redis.lrange<SentRef>(Keys.sent(session.did), 0, -1);
  const readMembers = await redis.smembers(Keys.sentRead(session.did));
  const readSet = new Set(readMembers as string[]);

  // Batch-fetch answers: one listRecords call per unique owner
  const uniqueOwners = [...new Set(sentRefs.map((r) => r.ownerDid))];
  const answerMapEntries = await Promise.all(
    uniqueOwners.map(async (ownerDid) => {
      const map = await getAnswersByOwner(ownerDid);
      return { ownerDid, map };
    })
  );
  const allAnswers = new Map(
    answerMapEntries.flatMap(({ map }) => [...map.entries()])
  );

  const items = sentRefs.map((ref) => {
    const koeUri = `at://${ref.ownerDid}/blue.mado.koe/${ref.koeRkey}`;
    const answers = allAnswers.get(koeUri) ?? [];
    const isRead = readSet.has(`${ref.ownerDid}:${ref.koeRkey}`);
    return { ref, koeUri, answers, isRead };
  });

  return (
    <div className="px-6 py-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: "var(--accent-light)" }}
        >
          <Send style={{ width: 17, height: 17, color: "var(--accent)" }} />
        </div>
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
            送信トレイ
          </h1>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            あなたが送った質問と返信
          </p>
        </div>
      </div>

      <SentList items={items} />
    </div>
  );
}
