<script lang="ts">
  import { Eye, Lock, Globe, MessageCircle } from "lucide-svelte";

  const features = [
    {
      icon: Eye, color: "text-blue-400", bg: "bg-blue-600/12",
      title: "半匿名性",
      body: "送り主は窓のオーナーにのみ開示されます。第三者が声と送信者の紐付けを知る手段はありません。",
    },
    {
      icon: Lock, color: "text-emerald-400", bg: "bg-emerald-400/10",
      title: "暗号化保護",
      body: "送り主のDIDはECIES（楕円曲線統合暗号化スキーム）で窓の公開鍵により暗号化されます。秘密鍵を持つオーナーだけが復号できます。",
    },
    {
      icon: Globe, color: "text-blue-400", bg: "bg-blue-400/10",
      title: "ATProtocol基盤",
      body: "声・回答データはあなたのBluesky PDS（Personal Data Server）に保存されます。Mado独自のデータベースには頼らず、オープンな分散型プロトコルで動作します。",
    },
  ];
</script>

<div class="max-w-2xl mx-auto px-4 py-12 flex flex-col gap-10">
  <div>
    <div data-suisou-layout="row" class="mb-4">
      <div class="w-10 h-10 rounded-lg flex items-center justify-center bg-primary">
        <MessageCircle size={20} class="text-background" />
      </div>
      <h1 data-suisou-text="s24 w700" class="text-foreground">Madoについて</h1>
    </div>
    <p data-suisou-text="s16" class="leading-relaxed text-muted-foreground">
      Mado（窓）は、Blueskyアカウントを使った<strong class="text-foreground">半匿名の窓サービス</strong>です。
      声を送るにはBlueskyへのログインが必要なため完全匿名ではありませんが、
      送り主の情報は暗号化されて窓のオーナーにのみ届きます。
    </p>
  </div>
  <div class="flex flex-col gap-4">
    <h2 data-suisou-text="s20 w700" class="text-foreground">3つの特徴</h2>
    {#each features as feat}
      <div data-suisou-surface="panel" class="p-5 flex gap-4">
        <div class={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${feat.bg}`}>
          <feat.icon size={18} class={feat.color} />
        </div>
        <div>
          <p data-suisou-text="w700" class="mb-1 text-foreground">{feat.title}</p>
          <p class="leading-relaxed text-muted-foreground">{feat.body}</p>
        </div>
      </div>
    {/each}
  </div>
  <p data-suisou-text="s12" class="text-subtle">Mado はオープンベータです。仕様は予告なく変更される場合があります。</p>
</div>
