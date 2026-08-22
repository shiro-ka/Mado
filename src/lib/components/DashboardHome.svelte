<script lang="ts">
  import { Home, MessageSquare, Inbox, ChevronRight, Plus, AlertTriangle } from "lucide-svelte";
  import Button from "$lib/components/ui/button/button.svelte";
  import { cn } from "$lib/utils.js";
  import type { AppSession } from "$lib/store.js";
  import type { QuestionBox, Question } from "$lib/../types/index.js";

  interface Props {
    session: AppSession;
    boxes: QuestionBox[];
    questions: (Question & { isRead: boolean })[];
    sessionTtl: number | null;
    replyCount: number;
  }

  let { session, boxes, questions, sessionTtl, replyCount }: Props = $props();

  const SESSION_WARN_SECONDS = 7 * 24 * 60 * 60;
  const sessionExpiringSoon = $derived(sessionTtl !== null && sessionTtl < SESSION_WARN_SECONDS);
  const sessionDaysLeft = $derived(
    sessionTtl !== null ? Math.ceil(sessionTtl / (24 * 60 * 60)) : null
  );

  const unreadCount = $derived(questions.filter((q) => !q.isRead).length);
  const boxSlugMap = $derived(new Map(boxes.map((b) => [b.rkey, b.slug])));

  function questionHref(q: Question & { isRead: boolean }): string {
    const boxRkey = q.boxUri.split("/").pop() ?? "";
    const slug = boxSlugMap.get(boxRkey);
    if (!slug) return "/receive";
    return `/@${session.handle}/${slug}/${q.rkey}`;
  }
</script>

<div class="px-6 py-8 max-w-4xl mx-auto">
  <!-- Page heading -->
  <div class="flex items-center gap-2.5 mb-8">
    <Home size={22} class="text-primary shrink-0" />
    <h1 class="text-2xl font-bold text-foreground">ホーム</h1>
  </div>

  <!-- Session expiry warning -->
  {#if sessionExpiringSoon}
    <div data-suisou-layout="row" class="mb-6 rounded-xl px-4 py-3 bg-amber-400/8 border border-amber-400/30">
      <AlertTriangle size={16} class="text-amber-400 shrink-0" />
      <p class="flex-1 text-amber-400">
        セッションがあと{sessionDaysLeft}日で期限切れになります。
      </p>
      <a href="/auth/login" class="text-xs font-medium underline text-amber-400">再ログイン</a>
    </div>
  {/if}

  <!-- Stats -->
  <div class="grid grid-cols-3 gap-2.5 sm:gap-4 mb-8">
    {#each [
      { label: "開いた窓", value: boxes.length, unit: "個", color: "text-blue-400" },
      { label: "未読の声", value: unreadCount, unit: "件", color: "text-emerald-400" },
      { label: "声の返信", value: replyCount, unit: "回", color: "text-blue-400" },
    ] as stat}
      <div data-suisou-surface="panel" class="p-3 sm:p-5">
        <p class="text-xs font-medium mb-1.5 sm:mb-2 text-muted-foreground">{stat.label}</p>
        <p class="text-right">
          <span class={cn("text-2xl sm:text-3xl font-bold tabular-nums", stat.color)}>{stat.value}</span>
          <span class="text-xs sm:text-sm ml-0.5 text-subtle">{stat.unit}</span>
        </p>
      </div>
    {/each}
  </div>

  <!-- Quick actions -->
  <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
    <!-- Boxes -->
    <div data-suisou-surface="panel" class="p-6">
      <div class="flex items-center justify-between mb-4">
        <div data-suisou-layout="row">
          <MessageSquare size={16} class="text-blue-400" />
          <h2 class="font-bold text-foreground">窓</h2>
        </div>
        <a href={`/@${session.handle}`}>
          <Button variant="ghost" size="sm">
            すべて見る
            {#snippet rightIcon()}<ChevronRight size={13} />{/snippet}
          </Button>
        </a>
      </div>

      {#if boxes.length === 0}
        <div class="text-center py-6">
          <p class="mb-3 text-muted-foreground">まだ窓がありません</p>
          <a href={`/@${session.handle}/new`}>
            <Button size="sm">
              {#snippet leftIcon()}<Plus size={14} />{/snippet}
              作成する
            </Button>
          </a>
        </div>
      {:else}
        <div data-suisou-layout="stack">
          {#each boxes.slice(0, 3) as box}
            <a
              href={`/@${session.handle}/${box.slug}`}
              class="flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors duration-200 hover:bg-blue-950/20"
            >
              <span class="truncate text-foreground">{box.title}</span>
              <span class={cn("text-xs ml-2 shrink-0", box.isOpen ? "text-success" : "text-subtle")}>
                {box.isOpen ? "受付中" : "停止中"}
              </span>
            </a>
          {/each}
        </div>
      {/if}
    </div>

    <!-- Questions -->
    <div data-suisou-surface="panel" class="p-6">
      <div class="flex items-center justify-between mb-4">
        <div data-suisou-layout="row">
          <Inbox size={16} class="text-emerald-400" />
          <h2 class="font-bold text-foreground">受信トレイ</h2>
          {#if unreadCount > 0}
            <span class="text-xs px-1.5 py-0.5 rounded-full font-bold bg-primary text-background">
              {unreadCount}
            </span>
          {/if}
        </div>
        <a href="/receive">
          <Button variant="ghost" size="sm">
            すべて見る
            {#snippet rightIcon()}<ChevronRight size={13} />{/snippet}
          </Button>
        </a>
      </div>

      {#if questions.length === 0}
        <div class="text-center py-6">
          <p class="text-muted-foreground">まだ声が届いていません</p>
          <p class="text-xs mt-1 text-subtle">窓のURLをシェアしましょう</p>
        </div>
      {:else}
        <div data-suisou-layout="stack">
          {#each questions.slice(0, 4) as q}
            <a
              href={questionHref(q)}
              data-suisou-layout="row" class="px-3 py-2.5 rounded-lg transition-colors duration-200 hover:bg-blue-950/20"
            >
              {#if !q.isRead}
                <span class="w-1.5 h-1.5 rounded-full shrink-0 bg-primary"></span>
              {/if}
              <span class="truncate text-muted-foreground">{q.body}</span>
              <span class="text-xs ml-auto shrink-0 tabular-nums text-subtle">
                {new Date(q.createdAt).toLocaleDateString("ja-JP")}
              </span>
            </a>
          {/each}
        </div>
      {/if}
    </div>
  </div>
</div>
