<script lang="ts">
  import { RefreshCw, Bell, ChevronRight } from "lucide-svelte";
  import { invalidateAll } from "$app/navigation";
  import InboxList from "$lib/components/mado/InboxList.svelte";
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
  <title>受信トレイ | Mado</title>
</svelte:head>

<div data-suisou-layout="stack gap-3" data-suisou="container-s py-4 px-3">
  <div data-suisou-layout="row between">
    <h1 data-suisou-text="fs-24 fw-700">受信トレイ</h1>
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

  {#if !data.dmTouched}
    <a data-suisou-item="notice" data-suisou="accent" data-suisou-layout="row" data-suisou-text="fs-14" href="/settings/notifications" class="link">
      <Bell data-suisou-text="fs-20" data-suisou="accent" />
      <span data-suisou-layout="grow">新着をDMで受け取る設定</span>
      <ChevronRight data-suisou-text="fs-20" data-suisou="note" />
    </a>
  {/if}

  <InboxList inbox={data.inbox} ownerAvatar={data.session?.avatar} />
</div>

<style>
  .link:hover {
    background-image: linear-gradient(var(--suisou-color-hover), var(--suisou-color-hover));
  }

  :global(.spin) {
    animation: spin 800ms linear infinite;
  }
  @keyframes spin {
    to {
      rotate: 360deg;
    }
  }
</style>
