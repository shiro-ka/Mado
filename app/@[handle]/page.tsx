import { notFound } from "next/navigation";
import Link from "next/link";
import { Globe, MessageCircle } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { QuestionBoxCard } from "@/components/mado/question-box-card";
import { resolveHandle, getProfile, listBoxes } from "@/lib/atproto";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ handle: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  const cleanHandle = decodeURIComponent(handle).replace(/^@/, "");
  const profile = await getProfile(cleanHandle).catch(() => null);

  if (!profile) {
    return { title: "ユーザーが見つかりません" };
  }

  return {
    title: `${profile.displayName ?? `@${profile.handle}`} の質問箱 | Mado`,
    description: profile.description
      ? `${profile.description} — Madoで質問を送ろう`
      : `@${profile.handle} の質問箱 — Madoで匿名質問を送ろう`,
  };
}

export default async function ProfilePage({ params }: Props) {
  const { handle } = await params;
  const cleanHandle = decodeURIComponent(handle).replace(/^@/, "");

  const did = await resolveHandle(cleanHandle);
  if (!did) notFound();

  const [profile, boxes] = await Promise.all([
    getProfile(did),
    listBoxes(did),
  ]);

  if (!profile) notFound();

  const openBoxes = boxes.filter((b) => b.isOpen);

  return (
    <div className="flex flex-col min-h-dvh">
      <Header />
      <main className="flex-1 px-4 py-10">
        <div className="mx-auto max-w-2xl">
          {/* Profile header */}
          <div
            className="rounded-2xl p-6 mb-6 flex items-start gap-4"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border)",
            }}
          >
            {profile.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatar}
                alt={profile.handle}
                className="w-16 h-16 rounded-full object-cover shrink-0"
              />
            ) : (
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center shrink-0 font-bold text-2xl"
                style={{ background: "var(--accent)", color: "white" }}
              >
                {profile.handle[0]?.toUpperCase() ?? "?"}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h1
                className="text-xl font-bold"
                style={{ color: "var(--text-primary)" }}
              >
                {profile.displayName ?? `@${profile.handle}`}
              </h1>
              <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
                @{profile.handle}
              </p>
              {profile.description && (
                <p
                  className="text-sm mt-2 leading-relaxed"
                  style={{ color: "var(--text-muted)" }}
                >
                  {profile.description}
                </p>
              )}
              <a
                href={`https://bsky.app/profile/${profile.handle}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 mt-2 text-xs hover:opacity-80 transition-opacity"
                style={{ color: "#a78bfa" }}
              >
                <Globe style={{ width: 11, height: 11 }} />
                Blueskyで見る
              </a>
            </div>
          </div>

          {/* Box list */}
          <div className="mb-3 flex items-center gap-2">
            <MessageCircle
              style={{ width: 16, height: 16, color: "var(--text-subtle)" }}
            />
            <h2 className="text-sm font-semibold" style={{ color: "var(--text-muted)" }}>
              質問箱 ({openBoxes.length}件)
            </h2>
          </div>

          {openBoxes.length === 0 ? (
            <div
              className="rounded-2xl p-10 text-center"
              style={{
                background: "var(--bg-surface)",
                border: "1px dashed var(--border-strong)",
              }}
            >
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                現在受付中の質問箱はありません
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {openBoxes.map((box) => (
                <QuestionBoxCard
                  key={box.rkey}
                  box={box}
                  ownerHandle={profile.handle}
                />
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
