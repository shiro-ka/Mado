<script lang="ts">
  import { Send } from "lucide-svelte";
  import SentList from "$lib/components/mado/SentList.svelte";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
</script>

<svelte:head>
  <title>送信トレイ | Mado</title>
</svelte:head>

<div data-suisou-layout="stack gap-4" data-suisou="container" class="page">
  <div data-suisou-item="media">
    <span data-suisou-item="square"><Send data-suisou-text="fs-20" data-suisou="accent" /></span>
    <div data-suisou-item="media-content">
      <h1 data-suisou-text="fs-20 fw-700">送信トレイ</h1>
      <p data-suisou-text="fs-12" class="sub">あなたが送った声と返信</p>
    </div>
  </div>

  <SentList items={data.items} />
</div>

<style>
  .page {
    --suisou-measure: 42rem;
    padding: var(--suisou-space-4) var(--suisou-space-3);
  }
  .sub {
    color: var(--suisou-color-text-sub);
  }
</style>
