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
  import MadoIcon from "$lib/components/ui/MadoIcon.svelte";
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

<div data-suisou-layout="stack gap-5" data-suisou="container-m py-4 px-3">
  <div data-suisou-layout="stack gap-4 center" data-suisou-text="center" data-suisou="container-s">

    <div data-suisou-layout="row">
      <MadoIcon data-suisou-text="fs-32" data-suisou="accent" />
      <p data-suisou-text="fs-28 fw-700">Mado</p>
    </div>

    <p data-suisou-text="pre-line fs-16 s:fs-20" data-suisou="note">
      Blueskyで届ける半匿名のメッセージ
    </p>

    {#if !loggedIn}
      <div data-suisou="mt-4 mb-4 p-4" data-suisou-tray data-suisou-layout="stack gap-1 center">
        <LoginButton label="窓を開く" data-suisou-text="fs-16" style="--suisou-size-button: 3rem" />
        <LoginButton look="other" />
      </div>
    {/if}

  </div>

  <div data-suisou-layout="stack gap-4">
    <h2 data-suisou-text="fs-24 s:fs-28 fw-700 center">Madoの特徴</h2>

    <div data-suisou-layout="stack s:grid gap-3" style="--suisou-grid-cols: repeat(2, minmax(0, 1fr))">
      {#each features as feat}
        <div data-suisou-tray data-suisou-layout="stack">
          <span data-suisou-item="square"><feat.icon data-suisou-text="fs-20" data-suisou={feat.tone} /></span>
          <h3 data-suisou-text="fs-16 fw-700">{feat.title}</h3>
          <p data-suisou-text="fs-14" data-suisou="note" class="doc">{feat.description}</p>
        </div>
      {/each}
    </div>
  </div>

  <div data-suisou-tray data-suisou-layout="stack gap-4" data-suisou="p-4">
    <div data-suisou-layout="stack gap-1 center" data-suisou-text="center">
      <h2 data-suisou-text="fs-24 s:fs-28 fw-700">使い方</h2>
      <p data-suisou-text="fs-14 s:fs-16" data-suisou="note">3ステップで始められます</p>
    </div>

    <div data-suisou-layout="stack s:grid gap-3" style="--suisou-grid-cols: repeat(3, minmax(0, 1fr))">
      {#each steps as step}
        <div data-suisou-layout="stack gap-3 center" data-suisou-text="center">
          <span class="tile">
            <span data-suisou-item="square"><step.icon data-suisou-text="fs-20" data-suisou={step.tone} /></span>
            <span data-suisou-text="fs-12 fw-700" data-suisou="accent" class="num">{step.step}</span>
          </span>
          <div data-suisou-layout="stack gap-1 center">
            <h3 data-suisou-text="fs-16 fw-700">{step.title}</h3>
            <p data-suisou-text="fs-14" data-suisou="note" class="doc">{step.description}</p>
          </div>
        </div>
      {/each}
    </div>
  </div>

  {#if !loggedIn}
    <div data-suisou="mt-4 mb-4 p-4" data-suisou-tray data-suisou-layout="stack gap-1 center">
      <LoginButton label="窓を開く" data-suisou-text="fs-16" style="--suisou-size-button: 3rem" />
      <LoginButton look="other" />
    </div>
  {/if}

</div>

<style>
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
  }
</style>
