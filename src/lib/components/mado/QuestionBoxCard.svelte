<script lang="ts">
  import { MessageCircle, ChevronRight, Pin } from "lucide-svelte";
  import { boxPath } from "$lib/urls.js";
  import type { QuestionBox } from "$lib/../types/index.js";

  interface Props {
    box: QuestionBox;
    ownerHandle: string;
    isMain?: boolean;
  }

  let { box, ownerHandle, isMain = false }: Props = $props();

  const href = $derived(boxPath(ownerHandle, box.slug));
</script>

<a {href} data-suisou-tray="link" data-suisou-layout="stack" class="link">
  <div data-suisou-item="media">
    <div data-suisou-item="media-figure" class="glyph">
      <MessageCircle data-suisou-text="fs-20" data-suisou="accent" />
    </div>
    <div data-suisou-item="media-content">
      <h3 data-suisou-text="fs-14 fw-700 break" class="title">{box.title}</h3>
      {#if box.description}
        <p data-suisou-text="fs-12 clamp-2" data-suisou="note">{box.description}</p>
      {/if}
    </div>
    <div data-suisou-item="media-tail" data-suisou="note" class="chev">
      <ChevronRight data-suisou-text="fs-20" />
    </div>
  </div>

  <div data-suisou-layout="row wrap">
    {#if isMain}
      <span data-suisou-item="tag" data-suisou="accent">
        <Pin />
        メイン
      </span>
    {/if}
    <span data-suisou-item="tag" data-suisou={box.isOpen ? "success" : undefined}>
      {box.isOpen ? "受付中" : "受付停止"}
    </span>
  </div>
</a>

<style>
  .glyph {
    display: grid;
    place-items: center;
    width: 2.25rem;
    height: 2.25rem;
    border-radius: var(--suisou-radius);
    background: var(--suisou-color-item);
    border: 1px solid var(--suisou-color-line-weak);
  }
  .title {
    transition: color var(--suisou-duration-fast) var(--suisou-ease);
  }
  .link:hover .title {
    color: var(--suisou-color-accent);
  }
</style>
