<script lang="ts">
  import { Send } from "lucide-svelte";
  import { page } from "$app/state";
  import SentCard from "$lib/components/mado/SentCard.svelte";
  import Skeleton from "$lib/components/ui/Skeleton.svelte";
  import type { SentItem } from "$lib/../types/index.js";

  interface Props {
    sent: Promise<SentItem[]>;
    selfAvatar?: string;
  }

  let { sent, selfAvatar }: Props = $props();

  type Tab = "new" | "all";
  const tab = $derived((page.url.searchParams.get("tab") ?? "new") as Tab);
  const tabs: { key: Tab; label: string }[] = [
    { key: "new", label: "新しい返信" },
    { key: "all", label: "すべて" },
  ];
</script>

{#await sent}
  <div data-suisou-layout="row">
    {#each tabs as t}
      <span data-suisou-button aria-current={tab === t.key ? "page" : undefined}>
        {t.label}
        {#if t.key === "new"}
          <span data-suisou-item="tag" class="ghost">0</span>
        {/if}
      </span>
    {/each}
  </div>
  <div data-suisou-layout="stack gap-3">
    {#each Array(4) as _}
      <Skeleton height="5rem" />
    {/each}
  </div>
{:then items}
  {@const newCount = items.filter((i) => i.hasNewAnswer).length}
  {@const filtered = tab === "new" ? items.filter((i) => i.hasNewAnswer) : items}

  <div data-suisou-layout="row">
    {#each tabs as t}
      <a data-suisou-button href={`?tab=${t.key}`} aria-current={tab === t.key ? "page" : undefined}>
        {t.label}
        {#if t.key === "new"}
          <span data-suisou-item="tag" data-suisou="accent">{newCount}</span>
        {/if}
      </a>
    {/each}
  </div>

  {#if filtered.length === 0}
    <div data-suisou-tray data-suisou-layout="stack gap-3 center" data-suisou-text="center" data-suisou="bd-dash" class="empty">
      <Send data-suisou-text="fs-20" data-suisou="note" class="big" />
      <div data-suisou-layout="stack gap-1 center">
        {#if tab === "all"}
          <p data-suisou-text="fs-16 fw-700">まだ声を送っていません</p>
        {:else}
          <p data-suisou-text="fs-16 fw-700">返信を待っています...</p>
        {/if}
      </div>
    </div>
  {:else}
    <div data-suisou-layout="stack gap-3">
      {#each filtered as item (`${item.ownerDid}:${item.koeRkey}`)}
        <SentCard {item} {selfAvatar} showNewTag={tab !== "new" && item.hasNewAnswer} />
      {/each}
    </div>
  {/if}
{/await}

<style>
  .ghost {
    visibility: hidden;
  }
  .empty {
    padding: var(--suisou-space-4);
  }
  .empty :global(.big) {
    width: 2.25rem;
    height: 2.25rem;
  }
</style>
