import { notFound } from "next/navigation";
import Link from "next/link";
import { Shield, LogIn, Lock, Globe } from "lucide-react";
import { Header } from "@/components/shell/header";
import { Footer } from "@/components/shell/footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SendQuestionForm } from "@/components/mado/send-question-form";
import { resolveHandle, findBoxBySlug, getProfile } from "@/lib/atproto";
import { getSession } from "@/lib/auth";
import { hasOAuthSession } from "@/lib/oauth";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ user: string; slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { user, slug } = await params;
  const cleanHandle = decodeURIComponent(user).replace(/^@/, "");
  const did = await resolveHandle(cleanHandle).catch(() => null);
  if (!did) return { title: "質問箱が見つかりません" };

  const box = await findBoxBySlug(did, slug).catch(() => null);
  if (!box) return { title: "質問箱が見つかりません" };

  return {
    title: `${box.title} — @${cleanHandle} の質問箱 | Mado`,
    description:
      box.description ??
      `@${cleanHandle} への質問を送ろう。Madoの半匿名質問箱です。`,
  };
}

export default async function SendQuestionPage({ params }: Props) {
  const { user, slug } = await params;
  const cleanHandle = decodeURIComponent(user).replace(/^@/, "");

  const did = await resolveHandle(cleanHandle);
  if (!did) notFound();

  const [box, ownerProfile, session, ownerRegistered] = await Promise.all([
    findBoxBySlug(did, slug),
    getProfile(did),
    getSession(),
    hasOAuthSession(did),
  ]);

  if (!box) notFound();

  return (
    <div className="flex flex-col min-h-dvh">
      <Header />
      <main className="flex-1 px-4 py-10">
        <div className="mx-auto max-w-lg">
          {/* Owner header */}
          <div className="flex items-center gap-3 mb-6">
            {ownerProfile?.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={ownerProfile.avatar}
                alt={ownerProfile.handle}
                className="w-10 h-10 rounded-full object-cover shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-bold bg-accent text-white">
                {(ownerProfile?.handle ?? cleanHandle)[0]?.toUpperCase() ?? "?"}
              </div>
            )}
            <div className="min-w-0">
              <p className="font-semibold text-sm text-primary">
                {ownerProfile?.displayName ?? `@${ownerProfile?.handle ?? cleanHandle}`}
              </p>
              <a
                href={`https://bsky.app/profile/${ownerProfile?.handle ?? cleanHandle}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs hover:opacity-80 transition-opacity text-blue-400"
              >
                <Globe size={10} />
                @{ownerProfile?.handle ?? cleanHandle}
              </a>
            </div>
          </div>

          {/* Box info */}
          <div className="rounded-2xl p-6 mb-5 bg-surface border border-border">
            <div className="flex items-start gap-3 mb-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-lg font-bold text-primary">{box.title}</h1>
                  <Badge variant={box.isOpen ? "success" : "muted"} dot size="sm">
                    {box.isOpen ? "受付中" : "受付停止"}
                  </Badge>
                </div>
                {box.description && (
                  <p className="text-sm leading-relaxed text-muted">{box.description}</p>
                )}
              </div>
            </div>

            {/* Encryption badge */}
            <div className="flex items-center gap-1.5">
              <Lock size={11} className="text-subtle" />
              <span className="text-xs text-subtle">ECIES暗号化で保護されています</span>
            </div>
          </div>

          {/* Semi-anonymous disclosure */}
          <div className="rounded-xl p-4 mb-5 flex items-start gap-3 bg-amber-400/7 border border-amber-400/25">
            <Shield size={15} className="shrink-0 mt-0.5 text-amber-400" />
            <p className="text-xs leading-relaxed text-muted">
              <span className="font-semibold text-amber-400">半匿名のご注意：</span>{" "}
              このサービスは完全匿名ではありません。あなたのBlueskyアカウント情報は
              <strong className="text-primary">ボックスのオーナーにのみ</strong>
              開示されます。第三者には公開されません。
            </p>
          </div>

          {/* Owner not registered */}
          {!ownerRegistered && (
            <div className="rounded-xl p-6 text-center bg-surface border border-border">
              <p className="font-semibold text-sm mb-1 text-primary">
                このユーザーはMadoに登録されていません
              </p>
              <p className="text-xs text-muted">
                質問を送るには、オーナーがMadoにログインしている必要があります。
              </p>
            </div>
          )}

          {/* Box closed */}
          {ownerRegistered && !box.isOpen && (
            <div className="rounded-xl p-6 text-center bg-surface border border-border">
              <p className="font-semibold text-sm mb-1 text-primary">
                現在この質問箱は受付停止中です
              </p>
              <p className="text-xs text-muted">
                オーナーが受付を再開するまでお待ちください。
              </p>
            </div>
          )}

          {/* Not logged in */}
          {ownerRegistered && box.isOpen && !session && (
            <div className="rounded-2xl p-6 text-center flex flex-col items-center gap-4 bg-surface border border-border">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-accent-light">
                <LogIn size={20} className="text-blue-400" />
              </div>
              <div>
                <p className="font-semibold text-sm mb-1 text-primary">
                  質問するにはログインが必要です
                </p>
                <p className="text-xs leading-relaxed text-muted">
                  Blueskyアカウントでログインして質問を送りましょう。
                  送り主はオーナーのみに開示されます。
                </p>
              </div>
              <Link href={`/auth/login?next=/u/@${cleanHandle}/${slug}`} className="w-full">
                <Button size="lg" className="w-full">ログインして質問する</Button>
              </Link>
            </div>
          )}

          {/* Logged in */}
          {ownerRegistered && box.isOpen && session && (
            <div className="rounded-2xl p-6 bg-surface border border-border">
              <SendQuestionForm
                boxOwnerDid={box.ownerDid}
                boxRkey={box.rkey}
                senderHandle={session.handle}
              />
            </div>
          )}

          {/* Back link */}
          <div className="mt-5 text-center">
            <Link
              href={`/u/@${cleanHandle}`}
              className="text-xs hover:opacity-80 transition-opacity text-subtle"
            >
              ← @{cleanHandle} のプロフィールに戻る
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
