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
  import Button from "$lib/components/ui/button/button.svelte";
  import Glyph from "$lib/components/ui/Glyph.svelte";

  const features = [
    {
      icon: Eye, tone: "accent",
      title: "半匿名性",
      description: "送り主は窓のオーナーにのみ開示。声の内容と送信者情報は暗号化されて保存されるため、第三者には一切見えません。",
    },
    {
      icon: Lock, tone: "success",
      title: "暗号化保護",
      description: "ECIES (楕円曲線統合暗号化スキーム) を使用。窓のオーナーの公開鍵で暗号化し、秘密鍵がなければ誰も読めません。",
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
      step: "2", icon: MessageCircle, tone: "success",
      title: "窓を作る",
      description: "タイトルと説明文を設定して窓を公開。URLをシェアして声を募集しましょう。",
    },
    {
      step: "3", icon: Inbox, tone: "accent",
      title: "声を受け取る",
      description: "ホームから届いた声を確認・返答。送り主の情報も安全に確認できます。",
    },
  ];
</script>

<!-- Hero
     ★見出しは s28 md:s32 が Suisou の上限。旧実装は text-4xl md:text-6xl（36/60px）で、
       Suisou のスケール（12/14/16/20/24/28/32）に段が無い。**ヒーローは小さくなる**。
       Suisou に display の段を足すかどうかは要判断 → dev/todo/mado-suisou-ui.md -->
<section data-suisou-layout="stack" class="hero">
  <div data-suisou-layout="stack container gap-4" class="hero-inner">
    <span data-suisou-tag="accent">
      <Sparkles />
      ATProtocol基盤
    </span>

    <h1 data-suisou-text="s28 md:s32 w700" class="title">
      窓越しに、<br />
      <span class="accent">想いを届けよう</span>
    </h1>

    <p data-suisou-text="s16 md:s20 doc" class="lead">
      Madoは、Blueskyアカウントを使った半匿名の窓です。
      送り主は窓のオーナーだけに届き、暗号化によって守られます。
    </p>

    <div data-suisou-layout="stack" class="cta">
      <a href="/auth/login">
        <Button variant="default">
          窓を開く
          {#snippet rightIcon()}<ChevronRight />{/snippet}
        </Button>
      </a>
      <a href="#how-it-works">
        <Button variant="secondary">使い方を見る</Button>
      </a>
    </div>
  </div>
</section>

<!-- Semi-anonymous disclosure -->
<section class="band">
  <div data-suisou-banner="warning" data-suisou-media data-suisou-layout="container">
    <Shield data-suisou-icon="warning" data-suisou-media-icon />
    <div data-suisou-media-content>
      <p data-suisou-text="s14 w700" class="warn">半匿名性についてのご説明</p>
      <p data-suisou-text="s14 doc">
        このサービスは<strong>完全匿名ではありません</strong>。
        声を送信するにはBlueskyアカウントでのログインが必要です。
        あなたのDIDとハンドルは声に暗号化された形で含まれ、
        <strong>窓のオーナーのみ</strong>が復号して確認できます。
        第三者には開示されません。
      </p>
    </div>
  </div>
</section>

<!-- Features -->
<section id="features" class="band">
  <div data-suisou-layout="stack container gap-4" class="block">
    <div data-suisou-layout="stack gap-1" class="heading">
      <h2 data-suisou-text="s24 md:s28 w700">Madoの特徴</h2>
      <p data-suisou-text="s14 md:s16" class="sub">安全で信頼できる窓を実現する3つの柱</p>
    </div>

    <div data-suisou-layout="stack md:even gap-3" class="cards">
      {#each features as feat}
        <div data-suisou-surface="panel" data-suisou-layout="stack" class="card">
          <Glyph><feat.icon data-suisou-icon={feat.tone} /></Glyph>
          <h3 data-suisou-text="s16 w700">{feat.title}</h3>
          <p data-suisou-text="s14 doc" class="sub">{feat.description}</p>
        </div>
      {/each}
    </div>
  </div>
</section>

<!-- How it works -->
<section id="how-it-works" class="band">
  <div data-suisou-surface="panel" data-suisou-layout="stack container gap-4" class="block pad">
    <div data-suisou-layout="stack gap-1" class="heading">
      <h2 data-suisou-text="s24 md:s28 w700">使い方</h2>
      <p data-suisou-text="s14 md:s16" class="sub">3ステップで始められます</p>
    </div>

    <div data-suisou-layout="stack md:even gap-3" class="cards">
      {#each steps as step}
        <div data-suisou-layout="stack gap-3" class="step">
          <span class="tile">
            <Glyph><step.icon data-suisou-icon={step.tone} /></Glyph>
            <span data-suisou-text="s12 w700" class="num">{step.step}</span>
          </span>
          <div data-suisou-layout="stack gap-1" class="step-text">
            <h3 data-suisou-text="s16 w700">{step.title}</h3>
            <p data-suisou-text="s14 doc" class="sub">{step.description}</p>
          </div>
        </div>
      {/each}
    </div>
  </div>
</section>

<!-- CTA
     ★旧実装は青のグラデーション + 放射状の光だった。Suisou は「塗らない」「影は持たない」
       ので、面 + accent の罫に置き換えている。**見た目の華やぎは落ちる**ので、
       残したいならここは意図的な例外として扱う必要がある → 申し送り -->
<section class="band">
  <div data-suisou-surface="panel" data-suisou-layout="stack container gap-3" class="cta-box">
    <Send data-suisou-icon="accent" class="cta-icon" />
    <h2 data-suisou-text="s24 md:s28 w700">今すぐ始めよう</h2>
    <p data-suisou-text="s16" class="sub">Blueskyアカウントがあれば、無料で窓を開けます。</p>
    <a href="/auth/login">
      <Button variant="default">
        窓を開く
        {#snippet rightIcon()}<ChevronRight />{/snippet}
      </Button>
    </a>
  </div>
</section>

<style>
  .hero {
    padding: var(--suisou-space-4) var(--suisou-space-3);
  }
  .hero-inner {
    --suisou-measure: 48rem;
    text-align: center;
    align-items: center;
  }
  .title {
    letter-spacing: -0.01em;
  }
  .accent {
    color: var(--suisou-accent);
  }
  .lead {
    max-width: 36rem;
    color: var(--suisou-text-sub);
  }
  .cta {
    align-items: center;
  }
  /* ★打ち消し：stack md:row は効かない（md:row が align-items しか持たない）。 */
  @media (width >= 768px) {
    .cta {
      flex-direction: row;
      justify-content: center;
    }
  }

  .band {
    padding: var(--suisou-space-4) var(--suisou-space-3);
  }
  .pad {
    padding: var(--suisou-space-4);
  }
  .heading {
    text-align: center;
    align-items: center;
  }
  .sub {
    color: var(--suisou-text-sub);
  }
  .warn {
    color: var(--suisou-warning);
  }

  .step {
    text-align: center;
    align-items: center;
  }
  .step-text {
    align-items: center;
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
    background: var(--suisou-bg);
    border: 1px solid var(--suisou-accent);
    color: var(--suisou-accent);
  }

  .cta-box {
    --suisou-measure: 36rem;
    padding: var(--suisou-space-4);
    text-align: center;
    align-items: center;
    border-color: var(--suisou-accent);
  }
  .cta-box :global(.cta-icon) {
    width: 2.25rem;
    height: 2.25rem;
  }
</style>
