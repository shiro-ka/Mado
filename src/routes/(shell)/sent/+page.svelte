<script lang="ts">
  import { RefreshCw } from "lucide-svelte";
  import { invalidateAll } from "$app/navigation";
  import SentList from "$lib/components/mado/SentList.svelte";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  let refreshing = $state(false);
  async function refresh() {
    if (refreshing) return;
    refreshing = true;
    try {
      await invalidateAll();
    } finally {
      refreshing = false;
    }
  }
</script>

<svelte:head>
  <title>送信トレイ | Mado</title>
</svelte:head>

<div data-suisou-layout="stack gap-3" data-suisou="container-s" class="page">
  <div data-suisou-layout="row between">
    <h1 data-suisou-text="fs-24 fw-700">送信トレイ</h1>
    <button
      data-suisou-button="icon"
      onclick={refresh}
      disabled={refreshing}
      title="更新"
      aria-label="更新"
    >
      <RefreshCw class={refreshing ? "spin" : ""} />
    </button>
  </div>

  <SentList sent={data.sent} selfAvatar={data.session?.avatar} />
</div>

<style>
  .page {
    padding: var(--suisou-space-4) var(--suisou-space-3);
  }
</style>
