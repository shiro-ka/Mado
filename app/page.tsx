import Link from "next/link";
import { redirect } from "next/navigation";
import {
  MessageCircle,
  Lock,
  Globe,
  Shield,
  ChevronRight,
  Sparkles,
  Eye,
  UserCheck,
  Send,
  Inbox,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/auth";

export default async function LandingPage() {
  const session = await getSession();
  if (session) redirect("/dashboard");
  return (
    <div className="flex flex-col min-h-dvh">
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden px-4 pt-24 pb-20 md:pt-32 md:pb-28">
          <div className="relative mx-auto max-w-3xl text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium mb-6"
              style={{
                background: "var(--accent-light)",
                border: "1px solid rgba(124, 58, 237, 0.3)",
                color: "#c4b5fd",
              }}>
              <Sparkles style={{ width: 14, height: 14 }} />
              ATProtocol基盤
            </div>

            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 leading-tight"
              style={{ color: "var(--text-primary)" }}>
              窓越しに、
              <br />
              <span style={{ color: "#a78bfa" }}>想いを届けよう</span>
            </h1>

            <p className="text-lg md:text-xl mb-8 max-w-xl mx-auto leading-relaxed"
              style={{ color: "var(--text-muted)" }}>
              Madoは、Blueskyアカウントを使った半匿名の質問箱です。
              送り主はボックスオーナーだけに届き、暗号化によって守られます。
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/auth/login">
                <Button size="lg" rightIcon={<ChevronRight style={{ width: 18, height: 18 }} />}>
                  質問箱を開設する
                </Button>
              </Link>
              <Link href="#how-it-works">
                <Button variant="secondary" size="lg">
                  使い方を見る
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Semi-anonymous disclosure notice */}
        <section className="px-4 pb-12">
          <div className="mx-auto max-w-3xl">
            <div className="rounded-2xl p-5 flex gap-4"
              style={{
                background: "rgba(251, 191, 36, 0.07)",
                border: "1px solid rgba(251, 191, 36, 0.25)",
              }}>
              <Shield
                className="shrink-0 mt-0.5"
                style={{ width: 20, height: 20, color: "#fbbf24" }}
              />
              <div>
                <p className="font-semibold text-sm mb-1" style={{ color: "#fbbf24" }}>
                  半匿名性についてのご説明
                </p>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                  このサービスは<strong style={{ color: "var(--text-primary)" }}>完全匿名ではありません</strong>。
                  質問を送信するにはBlueskyアカウントでのログインが必要です。
                  あなたのDIDとハンドルは質問に暗号化された形で含まれ、
                  <strong style={{ color: "var(--text-primary)" }}>ボックスのオーナーのみ</strong>が復号して確認できます。
                  第三者には開示されません。
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="px-4 py-16">
          <div className="mx-auto max-w-5xl">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold mb-3"
                style={{ color: "var(--text-primary)" }}>
                Madoの特徴
              </h2>
              <p className="text-sm md:text-base" style={{ color: "var(--text-muted)" }}>
                安全で信頼できる質問箱を実現する3つの柱
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                {
                  icon: Eye,
                  color: "#a78bfa",
                  bg: "rgba(124, 58, 237, 0.12)",
                  title: "半匿名性",
                  description:
                    "送り主はボックスオーナーにのみ開示。質問内容と送信者情報は暗号化されて保存されるため、第三者には一切見えません。",
                },
                {
                  icon: Lock,
                  color: "#34d399",
                  bg: "rgba(52, 211, 153, 0.1)",
                  title: "暗号化保護",
                  description:
                    "ECIES (楕円曲線統合暗号化スキーム) を使用。ボックスオーナーの公開鍵で暗号化し、秘密鍵がなければ誰も読めません。",
                },
                {
                  icon: Globe,
                  color: "#60a5fa",
                  bg: "rgba(96, 165, 250, 0.1)",
                  title: "ATProtocol基盤",
                  description:
                    "データはあなたのBlueskyアカウントのPDSに保存されます。特定サービスに依存せず、オープンな分散型プロトコルで動作します。",
                },
              ].map((feat) => (
                <div
                  key={feat.title}
                  className="rounded-xl p-6"
                  style={{
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                    style={{ background: feat.bg }}
                  >
                    <feat.icon style={{ width: 20, height: 20, color: feat.color }} />
                  </div>
                  <h3 className="font-semibold text-base mb-2"
                    style={{ color: "var(--text-primary)" }}>
                    {feat.title}
                  </h3>
                  <p className="text-sm leading-relaxed"
                    style={{ color: "var(--text-muted)" }}>
                    {feat.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="px-4 py-16">
          <div
            className="mx-auto max-w-5xl rounded-2xl p-8 md:p-12"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border)",
            }}
          >
            <div className="text-center mb-10">
              <h2 className="text-2xl md:text-3xl font-bold mb-3"
                style={{ color: "var(--text-primary)" }}>
                使い方
              </h2>
              <p className="text-sm md:text-base" style={{ color: "var(--text-muted)" }}>
                3ステップで始められます
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  step: "01",
                  icon: UserCheck,
                  color: "#a78bfa",
                  title: "Blueskyでログイン",
                  description:
                    "Blueskyアカウントで認証します。質問箱を開設するにはログインが必要です。",
                },
                {
                  step: "02",
                  icon: MessageCircle,
                  color: "#34d399",
                  title: "質問箱を作成",
                  description:
                    "タイトルと説明文を設定して質問箱を公開。URLをシェアして質問を募集しましょう。",
                },
                {
                  step: "03",
                  icon: Inbox,
                  color: "#60a5fa",
                  title: "質問を受け取る",
                  description:
                    "ダッシュボードから届いた質問を確認・返答。送り主の情報も安全に確認できます。",
                },
              ].map((step) => (
                <div key={step.step} className="flex flex-col items-center text-center gap-4">
                  <div className="relative">
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center"
                      style={{ background: "var(--bg-elevated)" }}
                    >
                      <step.icon style={{ width: 24, height: 24, color: step.color }} />
                    </div>
                    <div
                      className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{ background: "var(--accent)", color: "white" }}
                    >
                      {step.step.slice(-1)}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-base mb-1.5"
                      style={{ color: "var(--text-primary)" }}>
                      {step.title}
                    </h3>
                    <p className="text-sm leading-relaxed"
                      style={{ color: "var(--text-muted)" }}>
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="px-4 py-16">
          <div className="mx-auto max-w-2xl text-center">
            <div
              className="rounded-3xl p-10 md:p-14 relative overflow-hidden"
              style={{
                background: "linear-gradient(135deg, rgba(124,58,237,0.2) 0%, rgba(79,70,229,0.15) 100%)",
                border: "1px solid rgba(124, 58, 237, 0.35)",
              }}
            >
              <div
                className="absolute inset-0 opacity-30 pointer-events-none"
                style={{
                  background:
                    "radial-gradient(ellipse at 50% 0%, rgba(124,58,237,0.4), transparent 70%)",
                }}
              />
              <div className="relative">
                <Send
                  className="mx-auto mb-4 opacity-80"
                  style={{ width: 36, height: 36, color: "#a78bfa" }}
                />
                <h2 className="text-2xl md:text-3xl font-bold mb-3"
                  style={{ color: "var(--text-primary)" }}>
                  今すぐ始めよう
                </h2>
                <p className="mb-6 text-base" style={{ color: "var(--text-muted)" }}>
                  Blueskyアカウントがあれば、無料で質問箱を開設できます。
                </p>
                <Link href="/auth/login">
                  <Button size="lg" rightIcon={<ChevronRight style={{ width: 18, height: 18 }} />}>
                    質問箱を開設する
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
