<script lang="ts">
  import { MessageCircle, Lock, CheckCircle2 } from "lucide-svelte";
  import { formatDate, truncate } from "$lib/utils.js";
  import type { Question } from "$lib/../types/index.js";

  interface Props {
    question: Question;
    preview?: string;
    href?: string;
  }

  let { question, preview, href: hrefProp }: Props = $props();

  const href = $derived(hrefProp ?? `/receive`);
</script>

<!-- ★面（下地・罫・角丸・余白）は surface="panel"、並びは media。
     Suisou は「面は並べ方を持たない」ので同じ要素に2つ書ける ――
     panel の中に flex の箱を作る、という段が1つ消える。 -->
<a {href} class="link">
  <div
    data-suisou-tray
    data-suisou-item="media"
    class="card"
    class:unread={!question.isRead}
  >
    <div data-suisou-item="media-figure" class="mark">
      {#if question.isRead}
        <CheckCircle2 data-suisou-text="fs-16" data-suisou="sub" />
      {:else}
        <span class="dot"></span>
      {/if}
    </div>

    <div data-suisou-item="media-content">
      <div data-suisou-layout="row between">
        {#if question.isRead}
          <span></span>
        {:else}
          <span data-suisou-item="tag" data-suisou="accent">未読</span>
        {/if}
        <span data-suisou-text="fs-12" class="sub">{formatDate(question.createdAt)}</span>
      </div>

      {#if preview}
        <p class="clamp">{truncate(preview, 120)}</p>
      {:else}
        <div data-suisou-layout="row" class="sub">
          <Lock data-suisou-text="fs-16" />
          <span data-suisou-text="fs-14" class="italic">暗号化されたメッセージ</span>
        </div>
      {/if}

      {#if question.senderHandle}
        <div data-suisou-layout="row" class="sub">
          <MessageCircle data-suisou-text="fs-16" />
          <span data-suisou-text="fs-12">@{question.senderHandle}</span>
        </div>
      {/if}
    </div>
  </div>
</a>

<style>
  .link {
    display: block;
  }
  .card {
    transition: border-color var(--suisou-duration-fast) var(--suisou-ease);
  }
  /* 未読は罫で示す。Suisou に「未読の面」は無いので、面の機能の線を accent に差し替える。 */
  .card.unread {
    border-color: var(--suisou-color-accent);
  }
  .link:hover .card {
    border-color: var(--suisou-color-line-strong);
  }

  .mark {
    padding-block-start: var(--suisou-space-1);
  }
  .dot {
    display: block;
    width: 0.5rem;
    height: 0.5rem;
    border-radius: var(--suisou-radius-pill);
    background: var(--suisou-color-accent);
  }

  .sub {
    color: var(--suisou-color-text-sub);
  }
  .italic {
    font-style: italic;
  }
  .clamp {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    overflow: hidden;
  }
</style>
