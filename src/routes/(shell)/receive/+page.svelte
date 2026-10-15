<script lang="ts">
  import { Inbox, RefreshCw, Bell, ChevronRight } from "lucide-svelte";
  import { invalidateAll } from "$app/navigation";
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

<div data-suisou-layout="stack gap-3" data-suisou="container" class="page">
  <div data-suisou-layout="row between">
    <div data-suisou-layout="stack gap-0" class="title">
      <h1 data-suisou-text="fs-24 fw-700">受信トレイ</h1>
      <p data-suisou-text="fs-14" class="sub">届いた声を確認しましょう</p>
    </div>
    <button
      data-suisou-button="icon"
      onclick={refresh}
      disabled={refreshing}
      title="更新"
      aria-label="更新"
    >
      <RefreshCw class={refreshing ? "spin" : ""} />
    </button>
  </div>

  <a data-suisou-button="block" data-suisou-layout="row" data-suisou-text="fs-14" href="/settings/notifications" class="link">
    <Bell data-suisou-text="fs-20" data-suisou="accent" />
    <span data-suisou-layout="grow">新着をDMで受け取る設定</span>
    <ChevronRight data-suisou-text="fs-20" data-suisou="sub" />
  </a>

  {#await data.inbox}
    <div data-suisou-tray data-suisou-layout="row gap-0">
      {#each tabs as t}
        <span data-suisou-button data-suisou-layout="grow">{t.label}</span>
      {/each}
    </div>
    <div data-suisou-layout="stack gap-3" class="items">
      {#each Array(4) as _}
        <Skeleton height="5rem" />
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

    <div data-suisou-tray data-suisou-layout="row gap-0">
      {#each tabs as t}
        <a
          data-suisou-button
          data-suisou-layout="grow"
          href={`/receive?tab=${t.key}`}
          aria-current={tab === t.key ? "page" : undefined}
        >
          {t.label}
          {#if t.key === "all"}
            <span data-suisou-item="tag">{allQuestions.length}</span>
          {:else if t.key === "unread"}
            <span data-suisou-item="tag">{unreadCount}</span>
          {/if}
        </a>
      {/each}
    </div>

    {#if filtered.length === 0}
      <div data-suisou-tray data-suisou-layout="stack gap-3 center" data-suisou-text="center" data-suisou="bd-dash" class="empty">
        <Inbox data-suisou-text="fs-20" data-suisou="sub" class="big" />
        <div data-suisou-layout="stack gap-1 center">
          <p data-suisou-text="fs-16 fw-700">
            {tab === "unread" ? "未読の声はありません" : "声がありません"}
          </p>
          <p data-suisou-text="fs-14" class="sub">
            {tab === "all" ? "窓のURLをシェアして声を募りましょう" : "すべての声を確認しました！"}
          </p>
        </div>
      </div>
    {:else}
      <div data-suisou-layout="stack gap-3" class="items">
        {#each filtered as question}
          <QuestionCard {question} preview={question.body} href={question.href} />
        {/each}
      </div>
    {/if}
  {/await}
</div>

<style>
  .page {
    max-width: 48rem;
    padding: var(--suisou-space-4) var(--suisou-space-3);
  }
  .link {
    color: var(--suisou-color-text-sub);
  }
  .link:hover {
    color: var(--suisou-color-text);
  }
  .sub {
    color: var(--suisou-color-text-sub);
  }

  .empty {
    padding: var(--suisou-space-4);
  }
  .empty :global(.big) {
    width: 2.25rem;
    height: 2.25rem;
  }

  :global(.spin) {
    animation: spin 800ms linear infinite;
  }
  @keyframes spin {
    to {
      rotate: 360deg;
    }
  }
</style>
