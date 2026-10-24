<script lang="ts">
  import { User, ChevronRight, Archive, ArchiveRestore, EllipsisVertical, Ban, Trash2 } from "lucide-svelte";
  import { page } from "$app/state";
  import Button from "$lib/components/ui/Button.svelte";
  import AnswerForm from "$lib/components/mado/AnswerForm.svelte";
  import { formatDate, truncate } from "$lib/utils.js";
  import type { Question } from "$lib/../types/index.js";

  interface Props {
    question: Question & { boxTitle?: string; answers?: string[] };
    href: string;
    heard: boolean;
    ownerAvatar?: string;
    showNewTag?: boolean;
    sentAnswers?: string[];
    onReplied?: (answerBody: string) => void;
    onThrough?: () => void;
    onUnheard?: () => void;
    onBlocked?: (senderDid: string) => void;
    onDeleted?: () => void;
  }

  let { question, href, heard, ownerAvatar, sentAnswers = [], showNewTag = false, onReplied, onThrough, onUnheard, onBlocked, onDeleted }: Props = $props();

  let replying = $state(false);
  const answers = $derived([...(question.answers ?? []), ...sentAnswers]);
  const shownAnswers = $derived(answers.slice(-2));
  const hiddenAnswers = $derived(answers.length - shownAnswers.length);
  let confirm = $state<"block" | "delete" | null>(null);
  let busy = $state<"through" | "unheard" | "block" | "delete" | null>(null);
  let failed = $state<string | null>(null);

  const name = $derived(question.senderDisplayName || question.senderHandle);

  async function run(kind: "through" | "unheard" | "block" | "delete") {
    busy = kind;
    failed = null;
    try {
      const res =
        kind === "through" || kind === "unheard"
          ? await fetch(`/api/questions/${question.rkey}/handled`, { method: kind === "through" ? "POST" : "DELETE" })
          : kind === "block"
            ? await fetch("/api/blocks/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ senderDid: question.senderDid }),
              })
            : await fetch(`/api/questions/${question.rkey}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      if (kind === "through") onThrough?.();
      else if (kind === "unheard") onUnheard?.();
      else if (kind === "block") onBlocked?.(question.senderDid!);
      else onDeleted?.();
    } catch {
      failed = { through: "既読にできませんでした", unheard: "未読に戻せませんでした", block: "ブロックできませんでした", delete: "削除できませんでした" }[kind];
    } finally {
      busy = null;
    }
  }

  function ask(kind: "block" | "delete") {
    if (confirm === kind) run(kind);
    else confirm = kind;
  }
</script>

<div data-suisou-tray="link" data-suisou-layout="stack gap-0" data-suisou="p-0" class="card">
  {#if question.boxTitle}
    <span data-suisou="bd-bottom py-1 px-2 note" data-suisou-text="fs-12 clamp-1">{question.boxTitle}</span>
  {/if}
  <a {href} data-suisou-item="media" data-suisou="p-2" class="main">
    <span data-suisou-item="media-figure">
      {#if question.senderAvatar}
        <img src={question.senderAvatar} alt="" data-suisou-item="circle" />
      {:else}
        <span data-suisou-item="circle"><User data-suisou-text="fs-16" /></span>
      {/if}
    </span>

    <div data-suisou-item="media-content">
      <span data-suisou-layout="row between">
        <span data-suisou-layout="row gap-1 grow" class="who">
          {#if name}
            <span data-suisou-text="fs-14 fw-500 clamp-1" class="name">{name}</span>
            {#if question.senderHandle && question.senderDisplayName}
              <span data-suisou-text="fs-12 clamp-1" data-suisou="note" class="handle">@{question.senderHandle}</span>
            {/if}
          {:else}
            <span data-suisou-text="fs-14" data-suisou="note">送り主不明</span>
          {/if}
        </span>
        <span data-suisou-layout="row gap-1">
          {#if showNewTag}
            <span data-suisou-item="tag" data-suisou="accent">新しい声</span>
          {/if}
          <span data-suisou-text="fs-12" data-suisou="note">{formatDate(question.createdAt)}</span>
        </span>
      </span>
      <span data-suisou-text="clamp-2 pre-line">{truncate(question.body, 120)}</span>
      {#if hiddenAnswers > 0}
        <span data-suisou-text="fs-12" data-suisou="mt-2 note">ほか {hiddenAnswers} 件の返信</span>
      {/if}
      {#each shownAnswers as a}
        <div data-suisou-item="media" data-suisou="mt-2" class="answer">
          <span data-suisou-item="media-figure">
            {#if ownerAvatar}
              <img src={ownerAvatar} alt="" data-suisou-item="circle small" />
            {:else}
              <span data-suisou-item="circle small"><User data-suisou-text="fs-12" /></span>
            {/if}
          </span>
          <span data-suisou-item="media-content"><span data-suisou-text="fs-14 clamp-2 pre-line">{a}</span></span>
        </div>
      {/each}
    </div>

    <span data-suisou-item="media-tail" class="go"><ChevronRight data-suisou="note" /></span>
  </a>

  <div data-suisou-layout="row end gap-1" class="actions">
    <Button variant="ghost" onclick={() => (replying = !replying)} aria-expanded={replying}>
      {#snippet leftIcon()}<img src="/mado-logo.svg" alt="" class="logo" />{/snippet}
      返信する
    </Button>
    {#if heard}
      <Button variant="ghost" loading={busy === "unheard"} onclick={() => run("unheard")}>
        {#snippet leftIcon()}<ArchiveRestore />{/snippet}
        未読に戻す
      </Button>
    {:else}
      <Button variant="ghost" loading={busy === "through"} onclick={() => run("through")}>
        {#snippet leftIcon()}<Archive />{/snippet}
        既読にする
      </Button>
    {/if}
    <Button
      variant="ghost"
      icon
      aria-label="そのほかの操作"
      popovertarget={`more-${question.rkey}`}
      onclick={() => (confirm = null)}
    >
      <EllipsisVertical />
    </Button>
  </div>

  <div
    popover="auto"
    id={`more-${question.rkey}`}
    data-suisou-tray="popup"
    data-suisou-layout="stack gap-1"
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
    <p data-suisou-text="fs-12 end" data-suisou="px-2 error">{failed}</p>
  {/if}

  {#if replying}
    <div data-suisou="bd-top p-2" class="reply">
      <AnswerForm
        koeUri={question.uri}
        questionBody={question.body}
        pageUrl={`${page.url.origin}${href}`}
        onSuccess={(_, answerBody) => onReplied?.(answerBody)}
      />
    </div>
  {/if}
</div>

<style>
  .card {
    position: relative;
  }
  .card:has(.reply:hover) {
    background-image: none;
  }
  .main {
    color: var(--suisou-color-text);
  }
  .main::after {
    content: "";
    position: absolute;
    inset: 0;
  }
  .actions,
  .reply {
    position: relative;
  }
  .actions {
    pointer-events: none;
  }
  .actions > :global(*) {
    pointer-events: auto;
  }
  .go {
    align-self: center;
  }
  .actions {
    padding: 0 var(--suisou-space-2) var(--suisou-space-2);
  }
  .logo {
    width: var(--suisou-size-icon);
    height: var(--suisou-size-icon);
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
  .answer {
    gap: var(--suisou-space-2);
  }
</style>
