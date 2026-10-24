<script lang="ts">
  import { User, Ban, ArrowLeft } from "lucide-svelte";
  import Button from "$lib/components/ui/Button.svelte";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  let removed = $state(new Set<string>());
  let busy = $state<string | null>(null);

  async function unblock(did: string) {
    busy = did;
    try {
      const res = await fetch("/api/blocks/remove", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senderDid: did }),
      });
      if (res.ok) removed = new Set([...removed, did]);
    } finally {
      busy = null;
    }
  }

  const list = $derived(data.blocked.filter((b) => !removed.has(b.did)));
</script>

<svelte:head>
  <title>ブロック中の人 | Mado</title>
</svelte:head>

<div data-suisou-layout="stack gap-3" data-suisou="container-s py-4 px-3">
  <div>
    <Button href="/settings" variant="ghost">
      {#snippet leftIcon()}<ArrowLeft />{/snippet}
      設定に戻る
    </Button>
  </div>
  <h1 data-suisou-text="fs-24 fw-700">ブロック中の人</h1>

  {#if list.length === 0}
    <div data-suisou-tray data-suisou-layout="stack gap-3 center" data-suisou-text="center" data-suisou="bd-dash p-4" class="empty">
      <Ban data-suisou-text="fs-20" data-suisou="note" class="big" />
      <p data-suisou-text="fs-16 fw-700">ブロック中の人はいません</p>
    </div>
  {:else}
    <div data-suisou-layout="stack gap-2">
      {#each list as b (b.did)}
        <div data-suisou-tray data-suisou-item="media">
          <span data-suisou-item="media-figure">
            {#if b.avatar}
              <img src={b.avatar} alt="" data-suisou-item="circle" />
            {:else}
              <span data-suisou-item="circle"><User data-suisou-text="fs-16" /></span>
            {/if}
          </span>
          <span data-suisou-item="media-content">
            <span data-suisou-text="fs-14 fw-500 clamp-1">{b.displayName || b.handle || b.did}</span>
            {#if b.handle && b.displayName}
              <span data-suisou-text="fs-12 clamp-1" data-suisou="note">@{b.handle}</span>
            {/if}
          </span>
          <span data-suisou-item="media-tail">
            <Button variant="outline" loading={busy === b.did} onclick={() => unblock(b.did)}>解除</Button>
          </span>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .empty :global(.big) {
    width: 2.25rem;
    height: 2.25rem;
  }
</style>
