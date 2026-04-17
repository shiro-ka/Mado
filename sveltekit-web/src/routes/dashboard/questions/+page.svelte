<script lang="ts">
  import { Inbox, RefreshCw } from "lucide-svelte";
  import { cn } from "$lib/utils.js";
  import QuestionCard from "$lib/components/mado/QuestionCard.svelte";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  type FilterTab = "all" | "unread" | "read";

  const tab = $derived(data.tab as FilterTab);

  const filtered = $derived(
    data.allQuestions.filter((q) => {
      if (tab === "unread") return !q.isRead;
      if (tab === "read") return q.isRead;
      return true;
    })
  );

  const unreadCount = $derived(data.allQuestions.filter((q) => !q.isRead).length);

  const tabs: { key: FilterTab; label: string; count?: number }[] = [
    { key: "all", label: "すべて" },
    { key: "unread", label: "未読" },
    { key: "read", label: "既読" },
  ];
</script>

<svelte:head>
  <title>受信トレイ | Mado</title>
</svelte:head>

<div class="px-6 py-8 max-w-3xl mx-auto">
  <!-- Header -->
  <div class="flex items-center justify-between mb-6">
    <div>
      <h1 class="text-2xl font-bold text-primary">受信トレイ</h1>
      <p class="text-sm mt-1 text-muted">届いた質問を確認しましょう</p>
    </div>
    <a href="/dashboard/questions" class="p-2 rounded-lg transition-colors duration-200 cursor-pointer text-subtle" title="更新">
      <RefreshCw size={16} />
    </a>
  </div>

  <!-- Filter tabs -->
  <div class="flex gap-1 p-1 rounded-xl mb-6 w-fit bg-surface">
    {#each tabs as t}
      <a
        href={`/dashboard/questions?tab=${t.key}`}
        class={cn(
          "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2",
          tab === t.key ? "bg-accent text-white" : "bg-transparent text-muted"
        )}
      >
        {t.label}
        {#if t.key === "all"}
          <span class={cn("text-xs px-1.5 py-0.5 rounded-full tabular-nums", tab === t.key ? "bg-white/20 text-white" : "bg-elevated text-subtle")}>
            {data.allQuestions.length}
          </span>
        {:else if t.key === "unread"}
          <span class={cn("text-xs px-1.5 py-0.5 rounded-full tabular-nums", tab === t.key ? "bg-white/20 text-white" : "bg-elevated text-subtle")}>
            {unreadCount}
          </span>
        {/if}
      </a>
    {/each}
  </div>

  <!-- Question list -->
  {#if filtered.length === 0}
    <div class="rounded-2xl p-12 flex flex-col items-center gap-4 text-center bg-surface border border-dashed border-border-strong">
      <Inbox size={36} class="text-subtle opacity-50" />
      <div>
        <p class="font-semibold text-base text-primary">
          {tab === "unread" ? "未読の質問はありません" : "質問がありません"}
        </p>
        <p class="text-sm mt-1 text-muted">
          {tab === "all" ? "質問箱のURLをシェアして質問を募りましょう" : "すべての質問を確認しました！"}
        </p>
      </div>
    </div>
  {:else}
    <div class="flex flex-col gap-3">
      {#each filtered as question}
        <QuestionCard {question} preview={question.body} />
      {/each}
    </div>
  {/if}
</div>
