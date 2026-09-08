<script lang="ts">
  import { Eye, Lock, Globe, MessageCircle } from "lucide-svelte";
  import Glyph from "$lib/components/ui/Glyph.svelte";

  // ★色は Suisou の閉じた集合（data-suisou-icon の値）で持つ。
  //   旧実装は "text-blue-400" / "bg-emerald-400/10" という Tailwind の生の色名を
  //   データに埋めていた ―― 色を決めるのは solve.py だけ、という掟から外れていた。
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

<div data-suisou-layout="stack container gap-4" class="page">
  <div data-suisou-layout="stack">
    <div data-suisou-layout="row">
      <Glyph><MessageCircle data-suisou-icon="accent" /></Glyph>
      <h1 data-suisou-text="s24 w700">Madoについて</h1>
    </div>
    <p data-suisou-text="s16 doc" class="sub">
      Mado（窓）は、Blueskyアカウントを使った<strong>半匿名の窓サービス</strong>です。
      声を送るにはBlueskyへのログインが必要なため完全匿名ではありませんが、
      送り主の情報は暗号化されて窓のオーナーにのみ届きます。
    </p>
  </div>

  <div data-suisou-layout="stack gap-3" class="group">
    <h2 data-suisou-text="s20 w700">3つの特徴</h2>
    {#each features as feat}
      <div data-suisou-surface="panel" data-suisou-media>
        <Glyph><feat.icon data-suisou-icon={feat.tone} /></Glyph>
        <div data-suisou-media-content>
          <p data-suisou-text="s14 w700">{feat.title}</p>
          <p data-suisou-text="s14 doc" class="sub">{feat.body}</p>
        </div>
      </div>
    {/each}
  </div>

  <p data-suisou-text="s12" class="sub">
    Mado はオープンベータです。仕様は予告なく変更される場合があります。
  </p>
</div>

<style>
  /* ★読む幅は container に任せ、上限だけ現場が決める。Suisou が --suisou-drawer や
     --suisou-spinner で「実寸は現場のもの」としているのと同じやり方。 */
  .page {
    --suisou-measure: 42rem;
    padding: var(--suisou-space-4) var(--suisou-space-3);
  }
  .sub {
    color: var(--suisou-text-sub);
  }
</style>
