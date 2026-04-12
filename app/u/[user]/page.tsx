import { notFound } from "next/navigation";
import Link from "next/link";
import { Globe, MessageCircle } from "lucide-react";
import { Header } from "@/components/shell/header";
import { Footer } from "@/components/shell/footer";
import { QuestionBoxCard } from "@/components/mado/question-box-card";
import { resolveHandle, getProfile, listBoxes } from "@/lib/atproto";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ user: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { user } = await params;
  const cleanHandle = decodeURIComponent(user).replace(/^@/, "");
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
  const { user } = await params;
  const cleanHandle = decodeURIComponent(user).replace(/^@/, "");

  const did = await resolveHandle(cleanHandle);
  if (!did) notFound();

  const [profile, boxes] = await Promise.all([
    getProfile(did),
    listBoxes(did),
  ]);

  const openBoxes = boxes.filter((b) => b.isOpen);

  return (
    <div className="flex flex-col min-h-dvh">
      <Header />
      <main className="flex-1 px-4 py-10">
        <div className="mx-auto max-w-2xl">
          {/* Profile header */}
          <div className="rounded-2xl p-6 mb-6 flex items-start gap-4 bg-surface border border-border">
            {profile?.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatar}
                alt={profile.handle}
                className="w-16 h-16 rounded-full object-cover shrink-0"
              />
            ) : (
              <div className="w-16 h-16 rounded-full flex items-center justify-center shrink-0 font-bold text-2xl bg-accent text-white">
                {(profile?.handle ?? cleanHandle)[0]?.toUpperCase() ?? "?"}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-primary">
                {profile?.displayName ?? `@${profile?.handle ?? cleanHandle}`}
              </h1>
              <p className="text-sm mt-0.5 text-muted">@{profile?.handle ?? cleanHandle}</p>
              {profile?.description && (
                <p className="text-sm mt-2 leading-relaxed text-muted">{profile.description}</p>
              )}
              <a
                href={`https://bsky.app/profile/${profile?.handle ?? cleanHandle}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 mt-2 text-xs hover:opacity-80 transition-opacity text-blue-400"
              >
                <Globe size={11} />
                Blueskyで見る
              </a>
            </div>
          </div>

          {/* Box list */}
          <div className="mb-3 flex items-center gap-2">
            <MessageCircle size={16} className="text-subtle" />
            <h2 className="text-sm font-semibold text-muted">
              質問箱 ({openBoxes.length}件)
            </h2>
          </div>

          {openBoxes.length === 0 ? (
            <div className="rounded-2xl p-10 text-center bg-surface border border-dashed border-border-strong">
              <p className="text-sm text-muted">現在受付中の質問箱はありません</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {openBoxes.map((box) => (
                <QuestionBoxCard
                  key={box.rkey}
                  box={box}
                  ownerHandle={profile?.handle ?? cleanHandle}
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
