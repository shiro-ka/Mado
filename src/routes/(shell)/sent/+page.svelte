<script lang="ts">
  import { Send } from "lucide-svelte";
  import SentList from "$lib/components/mado/SentList.svelte";
  import Glyph from "$lib/components/ui/Glyph.svelte";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
</script>

<svelte:head>
  <title>送信トレイ | Mado</title>
</svelte:head>

<div data-suisou-layout="stack container" class="page">
  <div data-suisou-media>
    <Glyph><Send data-suisou-icon="accent" /></Glyph>
    <div data-suisou-media-content>
      <h1 data-suisou-text="s20 w700">送信トレイ</h1>
      <p data-suisou-text="s12" class="sub">あなたが送った声と返信</p>
    </div>
  </div>

  <SentList items={data.items} />
</div>

<style>
  .page {
    --suisou-measure: 42rem;
    gap: var(--suisou-space-4);
    padding: var(--suisou-space-4) var(--suisou-space-3);
  }
  .sub {
    color: var(--suisou-text-sub);
  }
</style>
