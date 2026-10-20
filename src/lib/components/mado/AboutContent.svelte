<script lang="ts">
  import { Eye, Globe, MessageCircle } from "lucide-svelte";

  const features = [
    {
      icon: Eye, tone: "accent",
      title: "半匿名性",
      body: "送り主は窓のオーナーにのみ開示されます。第三者が声と送信者の紐付けを知る手段はありません。",
    },
    {
      icon: Globe, tone: "accent",
      title: "ATProtocol基盤",
      body: "声・返信データはあなたのBluesky PDS（Personal Data Server）に保存されます。オープンな分散型プロトコルで動作します。",
    },
  ];
</script>

<div data-suisou-layout="stack gap-4" data-suisou="container-s" class="page">
  <div data-suisou-layout="stack">
    <div data-suisou-layout="row">
      <span data-suisou-item="square"><MessageCircle data-suisou-text="fs-20" data-suisou="accent" /></span>
      <h1 data-suisou-text="fs-24 fw-700">Madoについて</h1>
    </div>
    <p data-suisou-text="fs-16" class="sub doc">
      Mado（窓）は、Blueskyアカウントを使った<strong>半匿名の窓サービス</strong>です。
      声を送るにはBlueskyへのログインが必要なため完全匿名ではありませんが、
      送り主の情報は窓のオーナーにのみ届きます。
    </p>
  </div>

  <div data-suisou-layout="stack gap-3" class="group">
    <h2 data-suisou-text="fs-20 fw-700">2つの特徴</h2>
    {#each features as feat}
      <div data-suisou-tray data-suisou-item="media">
        <span data-suisou-item="square"><feat.icon data-suisou-text="fs-20" data-suisou={feat.tone} /></span>
        <div data-suisou-item="media-content">
          <p data-suisou-text="fs-14 fw-700">{feat.title}</p>
          <p data-suisou-text="fs-14" class="sub doc">{feat.body}</p>
        </div>
      </div>
    {/each}
  </div>

  <p data-suisou-text="fs-12" class="sub">
    Mado はオープンベータです。仕様は予告なく変更される場合があります。
  </p>
</div>

<style>
  .page {
    padding: var(--suisou-space-4) var(--suisou-space-3);
  }
  .sub {
    color: var(--suisou-color-text-note);
  }
</style>
