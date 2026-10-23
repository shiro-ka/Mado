<script lang="ts">
  import {
    MessageCircle,
    Lock,
    Globe,
    Eye,
    UserCheck,
    Send,
    Inbox,
  } from "lucide-svelte";
  import Button from "$lib/components/ui/Button.svelte";
  import LoginButton from "$lib/components/shell/LoginButton.svelte";

  let { loggedIn = false }: { loggedIn?: boolean } = $props();

  const features = [
    {
      icon: Eye, tone: "accent",
      title: "半匿名性",
      description: "送り主は窓のオーナーにのみ開示。",
    },
    {
      icon: Globe, tone: "accent",
      title: "ATProtocol基盤",
      description: "データはあなたのBlueskyアカウントのPDSに保存されます。特定サービスに依存せず、オープンな分散型プロトコルで動作します。",
    },
  ];

  const steps = [
    {
      step: "1", icon: UserCheck, tone: "accent",
      title: "Blueskyでログイン",
      description: "Blueskyアカウントで認証します。窓を開くにはログインが必要です。",
    },
    {
      step: "2", icon: MessageCircle, tone: "accent",
      title: "窓を開ける",
      description: "タイトルと説明文を設定して窓を公開。URLをシェアして声を募集しましょう。",
    },
    {
      step: "3", icon: Inbox, tone: "accent",
      title: "声を受け取る",
      description: "受信トレイから届いた声を確認・返信。送り主の情報も安全に確認できます。",
    },
  ];
</script>

<div data-suisou-layout="stack" data-suisou="container-m" class="landing">
  <div data-suisou-layout="stack gap-4 center" data-suisou-text="center" class="hero">
    <h1 data-suisou-text="fs-28 s:fs-32 fw-700" class="title">
      窓越しに、<br />
      <span class="accent">想いを届けよう</span>
    </h1>

    <p data-suisou-text="fs-16 s:fs-20" class="lead doc">
      Madoは、Blueskyアカウントを使った半匿名の窓です。
      送り主は窓のオーナーだけに届きます。
    </p>

    <div data-suisou-layout="stack gap-1 center">
      <div data-suisou-layout="stack s:row s:middle center">
        {#if !loggedIn}
          <LoginButton label="窓を開く" />
        {/if}
        <Button href="#how-it-works" variant="secondary">使い方を見る</Button>
      </div>
      {#if !loggedIn}
        <LoginButton look="other" />
      {/if}
    </div>

    <p data-suisou-text="fs-12" class="sub doc">
      このサービスは<strong>完全匿名ではありません</strong>。
      声を送信するにはBlueskyアカウントでのログインが必要です。
    </p>
  </div>

  <div data-suisou-layout="stack gap-4">
    <div data-suisou-layout="stack gap-1 center" data-suisou-text="center">
      <h2 data-suisou-text="fs-24 s:fs-28 fw-700">Madoの特徴</h2>
      <p data-suisou-text="fs-14 s:fs-16" class="sub">安全で信頼できる窓を実現する2つの柱</p>
    </div>

    <div data-suisou-layout="stack s:grid gap-3" style="--suisou-grid-cols: repeat(2, minmax(0, 1fr))">
      {#each features as feat}
        <div data-suisou-tray data-suisou-layout="stack">
          <span data-suisou-item="square"><feat.icon data-suisou-text="fs-20" data-suisou={feat.tone} /></span>
          <h3 data-suisou-text="fs-16 fw-700">{feat.title}</h3>
          <p data-suisou-text="fs-14" class="sub doc">{feat.description}</p>
        </div>
      {/each}
    </div>
  </div>

  <div id="how-it-works" data-suisou-tray data-suisou-layout="stack gap-4" class="pad">
    <div data-suisou-layout="stack gap-1 center" data-suisou-text="center">
      <h2 data-suisou-text="fs-24 s:fs-28 fw-700">使い方</h2>
      <p data-suisou-text="fs-14 s:fs-16" class="sub">3ステップで始められます</p>
    </div>

    <div data-suisou-layout="stack s:grid gap-3" style="--suisou-grid-cols: repeat(3, minmax(0, 1fr))">
      {#each steps as step}
        <div data-suisou-layout="stack gap-3 center" data-suisou-text="center">
          <span class="tile">
            <span data-suisou-item="square"><step.icon data-suisou-text="fs-20" data-suisou={step.tone} /></span>
            <span data-suisou-text="fs-12 fw-700" class="num">{step.step}</span>
          </span>
          <div data-suisou-layout="stack gap-1 center">
            <h3 data-suisou-text="fs-16 fw-700">{step.title}</h3>
            <p data-suisou-text="fs-14" class="sub doc">{step.description}</p>
          </div>
        </div>
      {/each}
    </div>
  </div>

  {#if !loggedIn}
    <div data-suisou-tray data-suisou-layout="stack gap-3 center" data-suisou-text="center" class="cta-box">
      <Send data-suisou-text="fs-20" data-suisou="accent" class="cta-icon" />
      <h2 data-suisou-text="fs-24 s:fs-28 fw-700">今すぐ始めよう</h2>
      <p data-suisou-text="fs-16" class="sub">Blueskyアカウントがあれば、無料で窓を開けます。</p>
      <LoginButton label="窓を開く" />
    </div>
  {/if}
</div>

<style>
  .landing {
    gap: var(--suisou-space-5);
    padding: var(--suisou-space-4) var(--suisou-space-3);
  }
  .hero {
    width: 100%;
    max-width: 48rem;
    margin-inline: auto;
  }
  .title {
    letter-spacing: -0.01em;
  }
  .accent {
    color: var(--suisou-color-accent);
  }
  .lead {
    max-width: 36rem;
    color: var(--suisou-color-text-note);
  }
  .pad {
    padding: var(--suisou-space-4);
  }
  .sub {
    color: var(--suisou-color-text-note);
  }
  .tile {
    position: relative;
    flex: none;
  }
  .num {
    position: absolute;
    top: -0.375rem;
    inset-inline-end: -0.375rem;
    display: grid;
    place-items: center;
    width: 1.25rem;
    height: 1.25rem;
    border-radius: var(--suisou-radius-pill);
    background: var(--suisou-color-bg);
    border: 1px solid var(--suisou-color-accent);
    color: var(--suisou-color-accent);
  }

  .cta-box {
    width: 100%;
    max-width: 36rem;
    margin-inline: auto;
    padding: var(--suisou-space-4);
    border-color: var(--suisou-color-accent);
  }
  .cta-box :global(.cta-icon) {
    width: 2.25rem;
    height: 2.25rem;
  }
</style>
