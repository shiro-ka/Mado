<script lang="ts">
  import { MessageCircle, ChevronRight, Lock, Unlock, Pin } from "lucide-svelte";
  import { boxUrl } from "$lib/utils.js";
  import type { QuestionBox } from "$lib/../types/index.js";

  interface Props {
    box: QuestionBox;
    ownerHandle: string;
    questionCount?: number;
    isMain?: boolean;
  }

  let { box, ownerHandle, questionCount, isMain = false }: Props = $props();

  const href = $derived(boxUrl(ownerHandle, box.slug));
</script>

<a {href} class="link">
  <div data-suisou-tray data-suisou-layout="stack" class="card">
    <div data-suisou-item="media">
      <div data-suisou-item="media-figure" class="glyph">
        <MessageCircle data-suisou-text="fs-20" data-suisou="accent" />
      </div>
      <div data-suisou-item="media-content">
        <h3 data-suisou-text="fs-14 fw-700" class="title">{box.title}</h3>
        {#if box.description}
          <p data-suisou-text="fs-12 clamp-2" class="desc">{box.description}</p>
        {/if}
      </div>
      <div data-suisou-item="media-tail" class="chev">
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
        {#if box.isOpen}<Unlock />{:else}<Lock />{/if}
        {box.isOpen ? "受付中" : "受付停止"}
      </span>
      {#if questionCount !== undefined}
        <span data-suisou-text="fs-12" class="count">声 {questionCount}件</span>
      {/if}
    </div>
  </div>
</a>

<style>
  .link {
    display: block;
  }
  .link:hover .card {
    background-image: linear-gradient(var(--suisou-color-hover), var(--suisou-color-hover));
  }

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
    overflow-wrap: anywhere;
    transition: color var(--suisou-duration-fast) var(--suisou-ease);
  }
  .link:hover .title {
    color: var(--suisou-color-accent);
  }
  .desc {
    color: var(--suisou-color-text-note);
  }
  .chev {
    color: var(--suisou-color-text-note);
  }
  .link:hover .chev {
    color: var(--suisou-color-text);
  }

  .count {
    margin-inline-start: auto;
    color: var(--suisou-color-text-note);
  }
</style>
