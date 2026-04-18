<script lang="ts">
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
  } from "lucide-svelte";
  import Header from "$lib/components/shell/Header.svelte";
  import Footer from "$lib/components/shell/Footer.svelte";
  import Button from "$lib/components/ui/Button.svelte";
  import DashboardShell from "$lib/components/shell/DashboardShell.svelte";
  import DashboardHome from "$lib/components/DashboardHome.svelte";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  const features = [
    {
      icon: Eye,
      iconClass: "text-blue-400",
      bgClass: "bg-blue-600/12",
      title: "半匿名性",
      description: "送り主はボックスオーナーにのみ開示。質問内容と送信者情報は暗号化されて保存されるため、第三者には一切見えません。",
    },
    {
      icon: Lock,
      iconClass: "text-emerald-400",
      bgClass: "bg-emerald-400/10",
      title: "暗号化保護",
      description: "ECIES (楕円曲線統合暗号化スキーム) を使用。ボックスオーナーの公開鍵で暗号化し、秘密鍵がなければ誰も読めません。",
    },
    {
      icon: Globe,
      iconClass: "text-blue-400",
      bgClass: "bg-blue-400/10",
      title: "ATProtocol基盤",
      description: "データはあなたのBlueskyアカウントのPDSに保存されます。特定サービスに依存せず、オープンな分散型プロトコルで動作します。",
    },
  ];

  const steps = [
    {
      step: "01",
      icon: UserCheck,
      iconClass: "text-blue-400",
      title: "Blueskyでログイン",
      description: "Blueskyアカウントで認証します。質問箱を開設するにはログインが必要です。",
    },
    {
      step: "02",
      icon: MessageCircle,
      iconClass: "text-emerald-400",
      title: "質問箱を作成",
      description: "タイトルと説明文を設定して質問箱を公開。URLをシェアして質問を募集しましょう。",
    },
    {
      step: "03",
      icon: Inbox,
      iconClass: "text-blue-400",
      title: "質問を受け取る",
      description: "ダッシュボードから届いた質問を確認・返答。送り主の情報も安全に確認できます。",
    },
  ];
</script>

<svelte:head>
  <title>{data.session ? "ダッシュボード | Mado" : "Mado - 半匿名メッセージ"}</title>
  {#if !data.session}
    <meta name="description" content="ATProtocol基盤の半匿名メッセージサービス。Blueskyアカウントで声を送ろう。" />
  {/if}
</svelte:head>

{#if data.session && data.boxes !== undefined}
  {@const session = data.session}
  <DashboardShell {session}>
    <DashboardHome
      {session}
      boxes={data.boxes}
      questions={data.questions ?? []}
      sessionTtl={data.sessionTtl ?? null}
    />
  </DashboardShell>
{:else}
  <div class="flex flex-col min-h-dvh">
    <Header session={data.session} />
    <main class="flex-1">
      <!-- Hero -->
      <section class="relative overflow-hidden px-4 pt-24 pb-20 md:pt-32 md:pb-28">
        <div class="relative mx-auto max-w-3xl text-center">
          <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium mb-6 bg-accent-light border border-blue-600/30 text-blue-300">
            <Sparkles size={14} />
            ATProtocol基盤
          </div>

          <h1 class="text-4xl md:text-6xl font-bold tracking-tight mb-6 leading-tight text-primary">
            窓越しに、<br />
            <span class="text-blue-400">想いを届けよう</span>
          </h1>

          <p class="text-lg md:text-xl mb-8 max-w-xl mx-auto leading-relaxed text-muted">
            Madoは、Blueskyアカウントを使った半匿名の質問箱です。
            送り主はボックスオーナーだけに届き、暗号化によって守られます。
          </p>

          <div class="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a href="/auth/login">
              <Button size="lg">
                質問箱を開設する
                {#snippet rightIcon()}<ChevronRight size={18} />{/snippet}
              </Button>
            </a>
            <a href="#how-it-works">
              <Button variant="secondary" size="lg">使い方を見る</Button>
            </a>
          </div>
        </div>
      </section>

      <!-- Semi-anonymous disclosure -->
      <section class="px-4 pb-12">
        <div class="mx-auto max-w-3xl">
          <div class="rounded-2xl p-5 flex gap-4 bg-amber-400/7 border border-amber-400/25">
            <Shield size={20} class="shrink-0 mt-0.5 text-amber-400" />
            <div>
              <p class="font-semibold text-sm mb-1 text-amber-400">半匿名性についてのご説明</p>
              <p class="text-sm leading-relaxed text-muted">
                このサービスは<strong class="text-primary">完全匿名ではありません</strong>。
                質問を送信するにはBlueskyアカウントでのログインが必要です。
                あなたのDIDとハンドルは質問に暗号化された形で含まれ、
                <strong class="text-primary">ボックスのオーナーのみ</strong>が復号して確認できます。
                第三者には開示されません。
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- Features -->
      <section id="features" class="px-4 py-16">
        <div class="mx-auto max-w-5xl">
          <div class="text-center mb-12">
            <h2 class="text-2xl md:text-3xl font-bold mb-3 text-primary">Madoの特徴</h2>
            <p class="text-sm md:text-base text-muted">安全で信頼できる質問箱を実現する3つの柱</p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
            {#each features as feat}
              <div class="rounded-xl p-6 bg-surface border border-border">
                <div class={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${feat.bgClass}`}>
                  <feat.icon size={20} class={feat.iconClass} />
                </div>
                <h3 class="font-semibold text-base mb-2 text-primary">{feat.title}</h3>
                <p class="text-sm leading-relaxed text-muted">{feat.description}</p>
              </div>
            {/each}
          </div>
        </div>
      </section>

      <!-- How it works -->
      <section id="how-it-works" class="px-4 py-16">
        <div class="mx-auto max-w-5xl rounded-2xl p-8 md:p-12 bg-surface border border-border">
          <div class="text-center mb-10">
            <h2 class="text-2xl md:text-3xl font-bold mb-3 text-primary">使い方</h2>
            <p class="text-sm md:text-base text-muted">3ステップで始められます</p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            {#each steps as step}
              <div class="flex flex-col items-center text-center gap-4">
                <div class="relative">
                  <div class="w-14 h-14 rounded-2xl flex items-center justify-center bg-elevated">
                    <step.icon size={24} class={step.iconClass} />
                  </div>
                  <div class="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold bg-accent text-white">
                    {step.step.slice(-1)}
                  </div>
                </div>
                <div>
                  <h3 class="font-semibold text-base mb-1.5 text-primary">{step.title}</h3>
                  <p class="text-sm leading-relaxed text-muted">{step.description}</p>
                </div>
              </div>
            {/each}
          </div>
        </div>
      </section>

      <!-- CTA -->
      <section class="px-4 py-16">
        <div class="mx-auto max-w-2xl text-center">
          <div class="rounded-3xl p-10 md:p-14 relative overflow-hidden bg-gradient-to-br from-blue-600/20 to-blue-900/20 border border-blue-600/35">
            <div
              class="absolute inset-0 opacity-30 pointer-events-none"
              style="background: radial-gradient(ellipse at 50% 0%, rgba(0,133,255,0.4), transparent 70%)"
            ></div>
            <div class="relative">
              <Send size={36} class="mx-auto mb-4 opacity-80 text-blue-400" />
              <h2 class="text-2xl md:text-3xl font-bold mb-3 text-primary">今すぐ始めよう</h2>
              <p class="mb-6 text-base text-muted">
                Blueskyアカウントがあれば、無料で質問箱を開設できます。
              </p>
              <a href="/auth/login">
                <Button size="lg">
                  質問箱を開設する
                  {#snippet rightIcon()}<ChevronRight size={18} />{/snippet}
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>

    <Footer />
  </div>
{/if}
