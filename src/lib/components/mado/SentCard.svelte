<script lang="ts">
  import { User, ChevronRight } from "lucide-svelte";
  import { formatDate, truncate } from "$lib/utils.js";
  import type { SentItem } from "$lib/../types/index.js";

  interface Props {
    item: SentItem;
    selfAvatar?: string;
    showNewTag?: boolean;
  }

  let { item, selfAvatar, showNewTag = false }: Props = $props();

  const shownAnswers = $derived(item.answers.slice(-2));
  const hiddenAnswers = $derived(item.answers.length - shownAnswers.length);
  const name = $derived(item.ownerDisplayName || item.ownerHandle);
</script>

{#snippet circle(src: string | undefined, size: string)}
  {#if src}
    <img {src} alt="" data-suisou-item="circle {size}" />
  {:else}
    <span data-suisou-item="circle {size}"><User data-suisou-text={size === "small" ? "fs-12" : "fs-16"} /></span>
  {/if}
{/snippet}

{#snippet content()}
  <div data-suisou-item="media-content">
    <div data-suisou-item="media" class="mine">
      <span data-suisou-item="media-figure">{@render circle(selfAvatar, "small")}</span>
      <span data-suisou-item="media-content">
        <span data-suisou-text="fs-14 clamp-2" class="text sub">{truncate(item.body, 120)}</span>
      </span>
    </div>
    {#if hiddenAnswers > 0}
      <span data-suisou-text="fs-12" class="more sub">ほか {hiddenAnswers} 件の返信</span>
    {/if}
    {#each shownAnswers as a}
      <div data-suisou-item="media" class="answer">
        <span data-suisou-item="media-figure">{@render circle(item.ownerAvatar, "")}</span>
        <div data-suisou-item="media-content">
          <span data-suisou-text="fs-14 fw-500 clamp-1">{name ?? "窓の持ち主"}</span>
          <span data-suisou-text="clamp-2" class="text">{a}</span>
        </div>
      </div>
    {/each}
  </div>
{/snippet}

<div data-suisou-tray={item.href ? "link" : ""} data-suisou-layout="stack gap-0" class="card">
  <div data-suisou="bd-bottom" data-suisou-layout="row between" class="box">
    <span data-suisou-layout="row gap-1 grow" class="who">
      {@render circle(item.ownerAvatar, "small")}
      {#if name}
        <span data-suisou-text="fs-12 fw-500 clamp-1" class="name">{name}</span>
      {:else}
        <span data-suisou-text="fs-12" class="sub">窓の持ち主不明</span>
      {/if}
      {#if item.boxTitle}
        <span data-suisou-text="fs-12" class="sub">·</span>
        <span data-suisou-text="fs-12 clamp-1" class="sub title">{item.boxTitle}</span>
      {/if}
    </span>
    <span data-suisou-layout="row gap-1">
      {#if showNewTag}
        <span data-suisou-item="tag" data-suisou="accent">新しい返信</span>
      {/if}
      <span data-suisou-text="fs-12" class="sub">{formatDate(item.sentAt)}</span>
    </span>
  </div>
  {#if item.href}
    <a href={item.href} data-suisou-item="media" class="main">
      {@render content()}
      <span data-suisou-item="media-tail" class="go"><ChevronRight data-suisou="note" /></span>
    </a>
  {:else}
    <div data-suisou-item="media" class="main">
      {@render content()}
    </div>
  {/if}
</div>

<style>
  .card {
    padding: 0;
  }
  .box {
    padding: var(--suisou-space-1) var(--suisou-space-2);
  }
  .main {
    padding: var(--suisou-space-2);
    color: var(--suisou-color-text);
    text-decoration: none;
  }
  .go {
    align-self: center;
  }
  .who {
    min-width: 0;
  }
  .name {
    flex: 0 1 auto;
    min-width: 0;
  }
  .title {
    flex: 0 1000 auto;
    min-width: 0;
  }
  .text {
    white-space: pre-line;
  }
  .mine {
    gap: var(--suisou-space-2);
  }
  .more {
    margin-block-start: var(--suisou-space-2);
  }
  .answer {
    margin-block-start: var(--suisou-space-2);
  }
  .sub {
    color: var(--suisou-color-text-note);
  }
</style>
