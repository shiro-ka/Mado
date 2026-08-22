<script lang="ts">
  import { Inbox, RefreshCw, Bell, ChevronRight } from "lucide-svelte";
  import { invalidateAll } from "$app/navigation";
  import { cn } from "$lib/utils.js";
  import QuestionCard from "$lib/components/mado/QuestionCard.svelte";
  import Skeleton from "$lib/components/ui/Skeleton.svelte";
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
      <p class="mt-1 text-muted-foreground">届いた声を確認しましょう</p>
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
    data-suisou-surface="panel" class="flex items-center gap-2.5 px-4 py-3 mb-6 text-muted-foreground hover:text-foreground hover:border-border-strong transition-colors"
  >
    <Bell size={16} class="shrink-0 text-blue-400" />
    <span class="flex-1">新着をDMで受け取る設定</span>
    <ChevronRight size={16} class="shrink-0 text-subtle" />
  </a>

  {#await data.inbox}
    <div class="flex gap-1 p-1 rounded-lg mb-6 w-fit bg-surface">
      {#each tabs as t}
        <div class="px-4 py-2 rounded-lg font-medium text-muted-foreground">{t.label}</div>
      {/each}
    </div>
    <div data-suisou-layout="stack">
      {#each Array(4) as _}
        <Skeleton class="h-20" />
      {/each}
    </div>
  {:then inbox}
    {@const allQuestions = inbox.allQuestions}
    {@const unreadCount = allQuestions.filter((q) => !q.isRead).length}
    {@const filtered = allQuestions.filter((q) => {
      if (tab === "unread") return !q.isRead;
      if (tab === "read") return q.isRead;
      return true;
    })}

    <!-- 連結のタブ。現在地は aria-current で示し、下地は Suisou が出す -->
    <div data-suisou-button-group class="mb-6">
      {#each tabs as t}
        <a
          href={`/receive?tab=${t.key}`}
          data-suisou-button="neutral"
          aria-current={tab === t.key ? "page" : undefined}
        >
          {t.label}
          {#if t.key === "all"}
            <span data-suisou-tag class="tabular-nums">
              {allQuestions.length}
            </span>
          {:else if t.key === "unread"}
            <span data-suisou-tag class="tabular-nums">
              {unreadCount}
            </span>
          {/if}
        </a>
      {/each}
    </div>

    {#if filtered.length === 0}
      <div data-suisou-surface="panel empty" class="p-12 flex flex-col items-center gap-4 text-center">
        <Inbox size={36} class="text-subtle opacity-50" />
        <div>
          <p class="font-bold text-base text-foreground">
            {tab === "unread" ? "未読の声はありません" : "声がありません"}
          </p>
          <p class="mt-1 text-muted-foreground">
            {tab === "all" ? "窓のURLをシェアして声を募りましょう" : "すべての声を確認しました！"}
          </p>
        </div>
      </div>
    {:else}
      <div data-suisou-layout="stack">
        {#each filtered as question}
          <QuestionCard {question} preview={question.body} href={question.href} />
        {/each}
      </div>
    {/if}
  {/await}
</div>
