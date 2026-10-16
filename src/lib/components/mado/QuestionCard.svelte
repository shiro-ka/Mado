<script lang="ts">
  import { User, ChevronRight, Archive, EllipsisVertical, Ban, Trash2 } from "lucide-svelte";
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
    onBlocked?: (senderDid: string) => void;
    onDeleted?: () => void;
  }

  let { question, href, showNewTag = false, onReplied, onThrough, onBlocked, onDeleted }: Props = $props();

  let replying = $state(false);
  let confirm = $state<"block" | "delete" | null>(null);
  let busy = $state<"through" | "block" | "delete" | null>(null);
  let failed = $state<string | null>(null);

  const name = $derived(question.senderDisplayName || question.senderHandle);

  async function run(kind: "through" | "block" | "delete") {
    busy = kind;
    failed = null;
    try {
      const res =
        kind === "through"
          ? await fetch(`/api/questions/${question.rkey}/handled`, { method: "POST" })
          : kind === "block"
            ? await fetch("/api/blocks/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ senderDid: question.senderDid }),
              })
            : await fetch(`/api/questions/${question.rkey}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      if (kind === "through") onThrough?.();
      else if (kind === "block") onBlocked?.(question.senderDid!);
      else onDeleted?.();
    } catch {
      failed = { through: "既読にできませんでした", block: "ブロックできませんでした", delete: "削除できませんでした" }[kind];
    } finally {
      busy = null;
    }
  }

  function ask(kind: "block" | "delete") {
    if (confirm === kind) run(kind);
    else confirm = kind;
  }
</script>

<div data-suisou-tray data-suisou-layout="stack gap-0" class="card">
  <a {href} data-suisou-item="media" class="main">
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
      <span class="text clamp">{truncate(question.body, 120)}</span>
    </span>

    <span data-suisou-item="media-tail" class="go"><ChevronRight data-suisou="sub" /></span>
  </a>

  <div data-suisou-layout="row end gap-1" class="actions">
    <Button variant="ghost" onclick={() => (replying = !replying)} aria-expanded={replying}>
      {#snippet leftIcon()}<img src="/mado-logo.svg" alt="" class="logo" />{/snippet}
      返信する
    </Button>
    <Button variant="ghost" loading={busy === "through"} onclick={() => run("through")}>
      {#snippet leftIcon()}<Archive />{/snippet}
      既読にする
    </Button>
    <Button
      variant="ghost"
      icon
      aria-label="そのほかの操作"
      popovertarget={`more-${question.rkey}`}
      style={`anchor-name: --more-${question.rkey}`}
      onclick={() => (confirm = null)}
    >
      <EllipsisVertical />
    </Button>
  </div>

  <div
    popover="auto"
    id={`more-${question.rkey}`}
    data-suisou-tray
    data-suisou-layout="stack gap-1"
    class="menu"
    style={`position-anchor: --more-${question.rkey}`}
  >
    {#if question.senderDid}
      <Button variant="ghost" loading={busy === "block"} onclick={() => ask("block")}>
        {#snippet leftIcon()}<Ban />{/snippet}
        {confirm === "block" ? "本当にブロックする" : "ブロック"}
      </Button>
    {/if}
    <Button variant="destructive" loading={busy === "delete"} onclick={() => ask("delete")}>
      {#snippet leftIcon()}<Trash2 />{/snippet}
      {confirm === "delete" ? "本当に削除する" : "削除"}
    </Button>
  </div>

  {#if failed}
    <p data-suisou-text="fs-12 end" class="error">{failed}</p>
  {/if}

  {#if replying}
    <div data-suisou="bd-top" class="reply">
      <AnswerForm
        koeUri={question.uri}
        questionBody={question.body}
        pageUrl={`${page.url.origin}${href}`}
        onSuccess={() => onReplied?.()}
      />
    </div>
  {/if}
</div>

<style>
  .card {
    padding: 0;
  }
  .main {
    padding: var(--suisou-space-2);
    color: var(--suisou-color-text);
    text-decoration: none;
  }
  .main:hover {
    background: var(--suisou-color-hover);
  }
  .go {
    align-self: center;
  }
  .actions {
    padding: 0 var(--suisou-space-2) var(--suisou-space-2);
  }
  .menu {
    inset: auto;
    margin: 0;
    position-area: top span-left;
    margin-block-end: var(--suisou-space-1);
  }
  .logo {
    width: var(--suisou-size-icon);
    height: var(--suisou-size-icon);
  }
  .reply {
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
    padding-inline: var(--suisou-space-2);
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
