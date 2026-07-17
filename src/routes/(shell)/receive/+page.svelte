<script lang="ts">
  import { Inbox, RefreshCw, Bell, ChevronRight } from "lucide-svelte";
  import { invalidateAll } from "$app/navigation";
  import { cn } from "$lib/utils.js";
  import QuestionCard from "$lib/components/mado/QuestionCard.svelte";
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

  const tabs: { key: FilterTab; label: string }[] = [
    { key: "all", label: "すべて" },
    { key: "unread", label: "未読" },
    { key: "read", label: "既読" },
  ];
</script>

<svelte:head>
  <title>受信トレイ | Mado</title>
</svelte:head>

<div class="px-6 py-8 max-w-3xl mx-auto">
  <div class="flex items-center justify-between mb-6">
    <div>
      <h1 class="text-2xl font-bold text-foreground">受信トレイ</h1>
      <p class="text-sm mt-1 text-muted-foreground">届いた声を確認しましょう</p>
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

  {#if filtered.length === 0}
    <div class="rounded-2xl p-12 flex flex-col items-center gap-4 text-center bg-surface border border-dashed border-border-strong">
      <Inbox size={36} class="text-subtle opacity-50" />
      <div>
        <p class="font-semibold text-base text-foreground">
          {tab === "unread" ? "未読の声はありません" : "声がありません"}
        </p>
        <p class="text-sm mt-1 text-muted-foreground">
          {tab === "all" ? "窓のURLをシェアして声を募りましょう" : "すべての声を確認しました！"}
        </p>
      </div>
    </div>
  {:else}
    <div class="flex flex-col gap-3">
      {#each filtered as question}
        <QuestionCard {question} preview={question.body} href={question.href} />
      {/each}
    </div>
  {/if}
</div>
