<script lang="ts">
  import { User, ChevronRight } from "lucide-svelte";
  import { page } from "$app/state";
  import Button from "$lib/components/ui/Button.svelte";
  import AnswerForm from "$lib/components/mado/AnswerForm.svelte";
  import { formatDate, truncate } from "$lib/utils.js";
  import type { Question } from "$lib/../types/index.js";

  interface Props {
    question: Omit<Question, "encryptedFrom">;
    href: string;
    showNewTag?: boolean;
    onReplied?: () => void;
    onThrough?: () => void;
  }

  let { question, href, showNewTag = false, onReplied, onThrough }: Props = $props();

  let open = $state(false);
  let through = $state<"idle" | "busy" | "error">("idle");

  const name = $derived(question.senderDisplayName || question.senderHandle);

  async function markThrough() {
    through = "busy";
    try {
      const res = await fetch(`/api/questions/${question.rkey}/handled`, { method: "POST" });
      if (!res.ok) throw new Error();
      through = "idle";
      onThrough?.();
    } catch {
      through = "error";
    }
  }
</script>

<div data-suisou-tray data-suisou-layout="stack gap-0" class="card">
  <button
    type="button"
    data-suisou-item="media"
    class="head"
    aria-expanded={open}
    onclick={() => (open = !open)}
  >
    <span data-suisou-item="media-figure">
      {#if question.senderAvatar}
        <img src={question.senderAvatar} alt="" data-suisou-item="circle" />
      {:else}
        <span data-suisou-item="circle"><User data-suisou-text="fs-16" /></span>
      {/if}
    </span>

    <span data-suisou-item="media-content">
      <span data-suisou-layout="row between">
        <span data-suisou-layout="row gap-1 grow" class="who">
          {#if name}
            <span data-suisou-text="fs-14 fw-500 one-line" class="name">{name}</span>
            {#if question.senderHandle && question.senderDisplayName}
              <span data-suisou-text="fs-12 one-line" class="sub handle">@{question.senderHandle}</span>
            {/if}
          {:else}
            <span data-suisou-text="fs-14" class="sub">送り主不明</span>
          {/if}
        </span>
        <span data-suisou-layout="row gap-1">
          {#if showNewTag}
            <span data-suisou-item="tag" data-suisou="accent">新しい声</span>
          {/if}
          <span data-suisou-text="fs-12" class="sub">{formatDate(question.createdAt)}</span>
        </span>
      </span>
      <span class="text" class:clamp={!open}>{open ? question.body : truncate(question.body, 120)}</span>
    </span>
  </button>

  {#if open}
    <div data-suisou-layout="stack gap-3" data-suisou="bd-top" class="body">
      <AnswerForm
        koeUri={question.uri}
        questionBody={question.body}
        pageUrl={`${page.url.origin}${href}`}
        onSuccess={() => onReplied?.()}
      />
      <div data-suisou-layout="row between">
        <Button variant="ghost" href={href}>
          詳細を開く
          {#snippet rightIcon()}<ChevronRight />{/snippet}
        </Button>
        <Button variant="outline" loading={through === "busy"} onclick={markThrough}>スルー</Button>
      </div>
      {#if through === "error"}
        <p data-suisou-text="fs-12" class="error">スルーに失敗しました</p>
      {/if}
    </div>
  {/if}
</div>

<style>
  .card {
    padding: 0;
  }
  .head {
    width: 100%;
    padding: var(--suisou-space-2);
    text-align: start;
    color: var(--suisou-color-text);
    border-radius: 0;
  }
  .body {
    padding: var(--suisou-space-2);
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
  .text {
    display: block;
  }
  .sub {
    color: var(--suisou-color-text-sub);
  }
  .error {
    color: var(--suisou-color-error);
  }
  .clamp {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    overflow: hidden;
  }
</style>
