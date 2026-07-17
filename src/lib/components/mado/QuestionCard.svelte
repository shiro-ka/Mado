<script lang="ts">
  import { Lock, Reply, EyeOff, RotateCcw, ChevronRight, CheckCircle2 } from "lucide-svelte";
  import AnswerForm from "$lib/components/mado/AnswerForm.svelte";
  import { cn, formatDate } from "$lib/utils.js";
  import type { Question } from "$lib/../types/index.js";

  // Question enriched by the /receive loader with derived inbox state.
  export interface InboxQuestion extends Question {
    answered: boolean;
    answerCount: number;
    dismissed: boolean;
    href: string;
    koeUri: string;
    pageUrl: string;
  }

  interface Props {
    question: InboxQuestion;
    /** Whether the inline reply composer is open (desktop only). */
    expanded?: boolean;
    /** True on narrow viewports — reply opens a bottom sheet at page level. */
    isMobile?: boolean;
    /** Dismiss request in flight. */
    busy?: boolean;
    onReply?: () => void;
    onDismiss?: () => void;
    onAnswered?: () => void;
  }

  let {
    question,
    expanded = false,
    isMobile = false,
    busy = false,
    onReply,
    onDismiss,
    onAnswered,
  }: Props = $props();

  // On desktop the composer expands inline; on mobile it lives in a sheet.
  const showInline = $derived(expanded && !isMobile);
  const status = $derived(
    question.answered ? "answered" : question.dismissed ? "dismissed" : "unreplied"
  );
</script>

<div
  class={cn(
    "rounded-xl transition-colors duration-200 bg-surface border",
    showInline
      ? "border-blue-700/40"
      : status === "unreplied"
        ? "border-blue-700/35"
        : "border-border"
  )}
>
  <!-- Tap the body to open/close the composer -->
  <button
    type="button"
    onclick={onReply}
    class="w-full text-left px-4 pt-4 pb-3 cursor-pointer"
  >
    <div class="flex items-center gap-2 mb-1.5">
      {#if status === "unreplied"}
        <span class="text-xs px-2 py-0.5 rounded-full font-medium bg-primary/15 text-primary">未返信</span>
      {:else if status === "answered"}
        <span class="text-xs px-2 py-0.5 rounded-full font-medium inline-flex items-center gap-1 bg-emerald-400/12 text-emerald-400">
          <CheckCircle2 size={11} />
          回答済み{question.answerCount > 1 ? `・${question.answerCount}` : ""}
        </span>
      {:else}
        <span class="text-xs px-2 py-0.5 rounded-full font-medium bg-elevated text-subtle">スルー</span>
      {/if}
      <span class="text-xs ml-auto text-subtle">{formatDate(question.createdAt)}</span>
    </div>

    {#if question.body}
      <p class={cn("text-sm text-foreground whitespace-pre-wrap", !showInline && "line-clamp-2")}>
        {question.body}
      </p>
    {:else}
      <div class="flex items-center gap-1.5">
        <Lock size={12} class="text-subtle" />
        <span class="text-sm italic text-subtle">暗号化されたメッセージ</span>
      </div>
    {/if}
  </button>

  <!-- Action row -->
  <div class="flex items-center gap-1 px-3 pb-3">
    <button
      type="button"
      onclick={onReply}
      class={cn(
        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer",
        showInline
          ? "bg-primary/15 text-primary"
          : "text-muted-foreground hover:text-foreground hover:bg-elevated"
      )}
    >
      <Reply size={13} />
      {question.answered ? "追記" : "回答する"}
    </button>

    <button
      type="button"
      onclick={onDismiss}
      disabled={busy}
      class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer text-muted-foreground hover:text-foreground hover:bg-elevated disabled:opacity-50"
    >
      {#if question.dismissed}
        <RotateCcw size={13} />
        戻す
      {:else}
        <EyeOff size={13} />
        スルー
      {/if}
    </button>

    <a
      href={question.href}
      class="ml-auto inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs transition-colors text-subtle hover:text-foreground hover:bg-elevated"
    >
      詳細
      <ChevronRight size={13} />
    </a>
  </div>

  <!-- Inline composer (desktop) -->
  {#if showInline}
    <div class="px-4 pb-4 pt-4 border-t border-border">
      <AnswerForm
        koeUri={question.koeUri}
        questionBody={question.body}
        pageUrl={question.pageUrl}
        onSuccess={onAnswered}
      />
    </div>
  {/if}
</div>
