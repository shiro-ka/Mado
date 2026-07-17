<script lang="ts">
  import { Inbox, RefreshCw, Bell, ChevronRight } from "lucide-svelte";
  import { invalidateAll } from "$app/navigation";
  import { cn } from "$lib/utils.js";
  import QuestionCard, { type InboxQuestion } from "$lib/components/mado/QuestionCard.svelte";
  import BottomSheet from "$lib/components/ui/BottomSheet.svelte";
  import AnswerForm from "$lib/components/mado/AnswerForm.svelte";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  let refreshing = $state(false);
  async function refresh() {
    if (refreshing) return;
    refreshing = true;
    try {
      await invalidateAll();
    } finally {
      refreshing = false;
    }
  }

  type FilterTab = "unreplied" | "answered" | "all";
  const tab = $derived(
    (["unreplied", "answered", "all"].includes(data.tab) ? data.tab : "unreplied") as FilterTab
  );

  const questions = $derived(data.allQuestions as InboxQuestion[]);

  const filtered = $derived(
    questions.filter((q) => {
      if (tab === "unreplied") return !q.answered && !q.dismissed;
      if (tab === "answered") return q.answered;
      return true;
    })
  );

  const unrepliedCount = $derived(questions.filter((q) => !q.answered && !q.dismissed).length);
  const answeredCount = $derived(questions.filter((q) => q.answered).length);

  const tabs = $derived([
    { key: "unreplied" as const, label: "未返信", count: unrepliedCount },
    { key: "answered" as const, label: "回答済み", count: answeredCount },
    { key: "all" as const, label: "すべて", count: questions.length },
  ]);

  // Reply opens inline on desktop, in a bottom sheet on mobile.
  let isMobile = $state(false);
  $effect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const update = () => (isMobile = mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  });

  let activeRkey = $state<string | null>(null);
  const activeQuestion = $derived(questions.find((q) => q.rkey === activeRkey) ?? null);

  function toggleReply(rkey: string) {
    activeRkey = activeRkey === rkey ? null : rkey;
  }

  let dismissingRkey = $state<string | null>(null);
  async function toggleDismiss(q: InboxQuestion) {
    if (dismissingRkey) return;
    dismissingRkey = q.rkey;
    try {
      await fetch(`/api/questions/${q.rkey}/dismiss`, {
        method: q.dismissed ? "DELETE" : "POST",
      });
      if (activeRkey === q.rkey) activeRkey = null;
      await invalidateAll();
    } finally {
      dismissingRkey = null;
    }
  }

  async function onAnswered() {
    activeRkey = null;
    await invalidateAll();
  }

  const emptyText = $derived(
    tab === "unreplied"
      ? { title: "未返信の声はありません", sub: "届いた声にはすべて対応済みです 🎉" }
      : tab === "answered"
        ? { title: "回答した声はまだありません", sub: "未返信タブから回答してみましょう" }
        : { title: "声がまだ届いていません", sub: "質問箱のURLをシェアして声を募りましょう" }
  );
</script>

<svelte:head>
  <title>受信トレイ | Mado</title>
</svelte:head>

<div class="px-6 py-8 max-w-3xl mx-auto">
  <div class="flex items-center justify-between mb-6">
    <div>
      <h1 class="text-2xl font-bold text-foreground">受信トレイ</h1>
      <p class="text-sm mt-1 text-muted-foreground">届いた声にその場で返信できます</p>
    </div>
    <button
      onclick={refresh}
      disabled={refreshing}
      class="p-2 rounded-lg transition-colors duration-200 cursor-pointer text-subtle hover:text-foreground disabled:opacity-50"
      title="更新"
      aria-label="更新"
    >
      <RefreshCw size={16} class={cn(refreshing && "animate-spin")} />
    </button>
  </div>

  <a
    href="/settings/notifications"
    class="flex items-center gap-2.5 px-4 py-3 mb-6 rounded-xl bg-surface border border-border text-sm text-muted-foreground hover:text-foreground hover:border-border-strong transition-colors"
  >
    <Bell size={16} class="shrink-0 text-blue-400" />
    <span class="flex-1">新着をDMで受け取る設定</span>
    <ChevronRight size={16} class="shrink-0 text-subtle" />
  </a>

  <div class="flex gap-1 p-1 rounded-xl mb-6 w-fit bg-surface">
    {#each tabs as t}
      <a
        href={`/receive?tab=${t.key}`}
        class={cn(
          "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2",
          tab === t.key ? "bg-primary text-white" : "bg-transparent text-muted-foreground"
        )}
      >
        {t.label}
        <span
          class={cn(
            "text-xs px-1.5 py-0.5 rounded-full tabular-nums",
            tab === t.key ? "bg-white/20 text-white" : "bg-elevated text-subtle"
          )}
        >
          {t.count}
        </span>
      </a>
    {/each}
  </div>

  {#if filtered.length === 0}
    <div class="rounded-2xl p-12 flex flex-col items-center gap-4 text-center bg-surface border border-dashed border-border-strong">
      <Inbox size={36} class="text-subtle opacity-50" />
      <div>
        <p class="font-semibold text-base text-foreground">{emptyText.title}</p>
        <p class="text-sm mt-1 text-muted-foreground">{emptyText.sub}</p>
      </div>
    </div>
  {:else}
    <div class="flex flex-col gap-3">
      {#each filtered as question (question.rkey)}
        <QuestionCard
          {question}
          {isMobile}
          expanded={activeRkey === question.rkey}
          busy={dismissingRkey === question.rkey}
          onReply={() => toggleReply(question.rkey)}
          onDismiss={() => toggleDismiss(question)}
          {onAnswered}
        />
      {/each}
    </div>
  {/if}
</div>

<!-- Mobile reply composer -->
<BottomSheet
  open={isMobile && !!activeQuestion}
  title="回答する"
  onClose={() => (activeRkey = null)}
>
  {#if activeQuestion}
    {#if activeQuestion.body}
      <p class="text-sm text-foreground whitespace-pre-wrap mb-4 pb-4 border-b border-border">
        {activeQuestion.body}
      </p>
    {/if}
    <AnswerForm
      koeUri={activeQuestion.koeUri}
      questionBody={activeQuestion.body}
      pageUrl={activeQuestion.pageUrl}
      onSuccess={onAnswered}
    />
  {/if}
</BottomSheet>
