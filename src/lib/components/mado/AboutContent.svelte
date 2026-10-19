<script lang="ts">
  import { Eye, Lock, Globe, MessageCircle } from "lucide-svelte";

  const features = [
    {
      icon: Eye, tone: "accent",
      title: "半匿名性",
      body: "送り主は窓のオーナーにのみ開示されます。第三者が声と送信者の紐付けを知る手段はありません。",
    },
    {
      icon: Lock, tone: "success",
      title: "暗号化保護",
      body: "送り主のDIDはECIES（楕円曲線統合暗号化スキーム）で窓の公開鍵により暗号化されます。秘密鍵を持つオーナーだけが復号できます。",
    },
    {
      icon: Globe, tone: "accent",
      title: "ATProtocol基盤",
      body: "声・回答データはあなたのBluesky PDS（Personal Data Server）に保存されます。Mado独自のデータベースには頼らず、オープンな分散型プロトコルで動作します。",
    },
  ];
</script>

<div data-suisou-layout="stack gap-4" data-suisou="container" class="page">
  <div data-suisou-layout="stack">
    <div data-suisou-layout="row">
      <span data-suisou-item="square"><MessageCircle data-suisou-text="fs-20" data-suisou="accent" /></span>
      <h1 data-suisou-text="fs-24 fw-700">Madoについて</h1>
    </div>
    <p data-suisou-text="fs-16" class="sub doc">
      Mado（窓）は、Blueskyアカウントを使った<strong>半匿名の窓サービス</strong>です。
      声を送るにはBlueskyへのログインが必要なため完全匿名ではありませんが、
      送り主の情報は暗号化されて窓のオーナーにのみ届きます。
    </p>
  </div>

  <div data-suisou-layout="stack gap-3" class="group">
    <h2 data-suisou-text="fs-20 fw-700">3つの特徴</h2>
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
    max-width: 42rem;
    padding: var(--suisou-space-4) var(--suisou-space-3);
  }
  .sub {
    color: var(--suisou-color-text-note);
  }
</style>
