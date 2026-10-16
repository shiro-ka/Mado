<script lang="ts">
  import { User } from "lucide-svelte";
  import { formatDate, truncate } from "$lib/utils.js";
  import type { Question } from "$lib/../types/index.js";

  interface Props {
    question: Omit<Question, "encryptedFrom">;
    preview?: string;
    href?: string;
  }

  let { question, preview, href: hrefProp }: Props = $props();

  const href = $derived(hrefProp ?? `/receive`);
  const name = $derived(question.senderDisplayName || question.senderHandle);
</script>

<a {href} class="link">
  <div data-suisou-tray data-suisou-item="media" class="card" class:unread={!question.isRead}>
    <div data-suisou-item="media-figure">
      {#if question.senderAvatar}
        <img src={question.senderAvatar} alt="" data-suisou-item="circle" />
      {:else}
        <div data-suisou-item="circle"><User data-suisou-text="fs-16" /></div>
      {/if}
    </div>

    <div data-suisou-item="media-content">
      <div data-suisou-layout="row between">
        <div data-suisou-layout="row gap-1 grow" class="who">
          {#if name}
            <span data-suisou-text="fs-14 fw-500 one-line" class="name">{name}</span>
            {#if question.senderHandle && question.senderDisplayName}
              <span data-suisou-text="fs-12 one-line" class="sub handle">@{question.senderHandle}</span>
            {/if}
          {:else}
            <span data-suisou-text="fs-14" class="sub">送り主不明</span>
          {/if}
        </div>
        <div data-suisou-layout="row gap-1">
          {#if !question.isRead}
            <span data-suisou-item="tag" data-suisou="accent">未読</span>
          {/if}
          <span data-suisou-text="fs-12" class="sub">{formatDate(question.createdAt)}</span>
        </div>
      </div>

      {#if preview}
        <p class="clamp">{truncate(preview, 120)}</p>
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
  .card.unread {
    border-color: var(--suisou-color-accent);
  }
  .link:hover .card {
    border-color: var(--suisou-color-line-strong);
  }
  .who {
    min-width: 0;
  }
  .name {
    flex: 0 1 auto;
    min-width: 0;
  }
  .handle {
    flex: 0 1000 auto;
    min-width: 0;
  }
  .sub {
    color: var(--suisou-color-text-sub);
  }
  .clamp {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    overflow: hidden;
  }
</style>
