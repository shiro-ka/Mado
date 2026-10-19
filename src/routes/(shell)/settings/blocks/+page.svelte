<script lang="ts">
  import { User } from "lucide-svelte";
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

<div data-suisou-layout="stack gap-3" data-suisou="container" class="page">
  <h1 data-suisou-text="fs-24 fw-700">ブロック中の人</h1>

  {#if list.length === 0}
    <p data-suisou-text="fs-14" class="sub">ブロック中の人はいません</p>
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
            <span data-suisou-text="fs-14 fw-500 one-line">{b.displayName || b.handle || b.did}</span>
            {#if b.handle}
              <span data-suisou-text="fs-12 one-line" class="sub">@{b.handle}</span>
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
  .page {
    max-width: 42rem;
    padding: var(--suisou-space-4) var(--suisou-space-3);
  }
  .sub {
    color: var(--suisou-color-text-note);
  }
</style>
