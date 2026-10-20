<script lang="ts">
  import { Shield, Eye, User } from "lucide-svelte";

  const visibility = [
    {
      icon: User, tone: "accent",
      title: "窓のオーナー",
      items: ["声の本文", "送り主のDIDおよびBlueskyハンドル"],
    },
    {
      icon: Eye, tone: "accent",
      title: "第三者（一般の閲覧者）",
      items: ["送り主の情報：一切見えない"],
    },
  ];
</script>

<div data-suisou-layout="stack gap-4" data-suisou="container-s" class="page">
  <div data-suisou-layout="stack">
    <h1 data-suisou-text="fs-24 fw-700">半匿名の仕組み</h1>
    <p data-suisou-text="fs-16" class="sub doc">
      Madoは<strong>完全匿名ではありません</strong>。
      声を送るにはBlueskyアカウントでのログインが必要です。
    </p>
  </div>

  <div data-suisou-item="notice media" data-suisou="warning">
    <Shield data-suisou-item="media-figure" data-suisou-text="fs-20" data-suisou="warning" />
    <p data-suisou-item="media-content" data-suisou-text="fs-14" class="doc">
      声を送ると、あなたのBluesky DID（分散型識別子）がオーナーに届きます。
      オーナーはあなたのハンドル（@example.bsky.social）を確認できます。
      これを理解した上でご利用ください。
    </p>
  </div>

  <section data-suisou-layout="stack gap-3" class="group">
    <h2 data-suisou-text="fs-16 fw-700">誰が何を見られるか</h2>
    {#each visibility as row}
      <div data-suisou-tray data-suisou-item="media">
        <span data-suisou-item="square"><row.icon data-suisou-text="fs-20" data-suisou={row.tone} /></span>
        <div data-suisou-item="media-content">
          <p data-suisou-text="fs-14 fw-700">{row.title}</p>
          <ul data-suisou-text="fs-14" class="sub list">
            {#each row.items as item}
              <li>{item}</li>
            {/each}
          </ul>
        </div>
      </div>
    {/each}
  </section>
</div>

<style>
  .page {
    padding: var(--suisou-space-4) var(--suisou-space-3);
  }
  .sub {
    color: var(--suisou-color-text-note);
  }
  .list {
    padding-inline-start: var(--suisou-space-4);
  }
  .list li + li {
    margin-block-start: var(--suisou-space-1);
  }
  .list ::marker {
    color: var(--suisou-color-text-note);
  }
  strong {
    color: var(--suisou-color-text);
  }
</style>
