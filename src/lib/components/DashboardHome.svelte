<script lang="ts">
  import { MessageSquare, Inbox, ChevronRight, Plus, AlertTriangle } from "lucide-svelte";
  import Button from "$lib/components/ui/Button.svelte";
  import { cn } from "$lib/utils.js";
  import type { AppSession } from "$lib/store.js";
  import type { QuestionBox, Question } from "$lib/../types/index.js";

  interface Props {
    session: AppSession;
    boxes: QuestionBox[];
    questions: (Question & { isRead: boolean })[];
    sessionTtl: number | null;
  }

  let { session, boxes, questions, sessionTtl }: Props = $props();

  const SESSION_WARN_SECONDS = 7 * 24 * 60 * 60;
  const sessionExpiringSoon = $derived(sessionTtl !== null && sessionTtl < SESSION_WARN_SECONDS);
  const sessionDaysLeft = $derived(
    sessionTtl !== null ? Math.ceil(sessionTtl / (24 * 60 * 60)) : null
  );

  const unreadCount = $derived(questions.filter((q) => !q.isRead).length);
  const openBoxCount = $derived(boxes.filter((b) => b.isOpen).length);
</script>

<div class="px-6 py-8 max-w-4xl mx-auto">
  <!-- Welcome -->
  <div class="mb-8">
    <h1 class="text-2xl font-bold mb-1 text-primary">
      おかえりなさい、{session.displayName ?? `@${session.handle}`}
    </h1>
    <p class="text-sm text-muted">今日も窓から声が届いていますよ</p>
  </div>

  <!-- Session expiry warning -->
  {#if sessionExpiringSoon}
    <div class="mb-6 rounded-xl px-4 py-3 flex items-center gap-3 bg-amber-400/8 border border-amber-400/30">
      <AlertTriangle size={16} class="text-amber-400 shrink-0" />
      <p class="text-sm flex-1 text-amber-400">
        セッションがあと{sessionDaysLeft}日で期限切れになります。
      </p>
      <a href="/auth/login" class="text-xs font-medium underline text-amber-400">再ログイン</a>
    </div>
  {/if}

  <!-- Stats -->
  <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
    {#each [
      { label: "質問箱", value: boxes.length, sub: `${openBoxCount}件 受付中`, color: "text-blue-400" },
      { label: "未読の質問", value: unreadCount, sub: `全 ${questions.length}件`, color: "text-emerald-400" },
      { label: "総受信数", value: questions.length, sub: "累計", color: "text-blue-400" },
    ] as stat}
      <div class="rounded-xl p-5 bg-surface border border-border">
        <p class="text-xs font-medium mb-2 text-muted">{stat.label}</p>
        <p class={cn("text-3xl font-bold tabular-nums", stat.color)}>{stat.value}</p>
        <p class="text-xs mt-1 text-subtle">{stat.sub}</p>
      </div>
    {/each}
  </div>

  <!-- Quick actions -->
  <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
    <!-- Boxes -->
    <div class="rounded-xl p-6 bg-surface border border-border">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-2">
          <MessageSquare size={16} class="text-blue-400" />
          <h2 class="text-sm font-semibold text-primary">質問箱</h2>
        </div>
        <a href="/dashboard/boxes">
          <Button variant="ghost" size="sm">
            すべて見る
            {#snippet rightIcon()}<ChevronRight size={13} />{/snippet}
          </Button>
        </a>
      </div>

      {#if boxes.length === 0}
        <div class="text-center py-6">
          <p class="text-sm mb-3 text-muted">まだ質問箱がありません</p>
          <a href="/dashboard/boxes/new">
            <Button size="sm">
              {#snippet leftIcon()}<Plus size={14} />{/snippet}
              作成する
            </Button>
          </a>
        </div>
      {:else}
        <div class="flex flex-col gap-2">
          {#each boxes.slice(0, 3) as box}
            <a
              href={`/dashboard/boxes/${box.rkey}`}
              class="flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors duration-200 hover:bg-blue-950/20"
            >
              <span class="text-sm truncate text-primary">{box.title}</span>
              <span class={cn("text-xs ml-2 shrink-0", box.isOpen ? "text-success" : "text-subtle")}>
                {box.isOpen ? "受付中" : "停止中"}
              </span>
            </a>
          {/each}
        </div>
      {/if}
    </div>

    <!-- Questions -->
    <div class="rounded-xl p-6 bg-surface border border-border">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-2">
          <Inbox size={16} class="text-emerald-400" />
          <h2 class="text-sm font-semibold text-primary">受信トレイ</h2>
          {#if unreadCount > 0}
            <span class="text-xs px-1.5 py-0.5 rounded-full font-bold bg-accent text-white">
              {unreadCount}
            </span>
          {/if}
        </div>
        <a href="/dashboard/questions">
          <Button variant="ghost" size="sm">
            すべて見る
            {#snippet rightIcon()}<ChevronRight size={13} />{/snippet}
          </Button>
        </a>
      </div>

      {#if questions.length === 0}
        <div class="text-center py-6">
          <p class="text-sm text-muted">まだ質問が届いていません</p>
          <p class="text-xs mt-1 text-subtle">質問箱のURLをシェアしましょう</p>
        </div>
      {:else}
        <div class="flex flex-col gap-2">
          {#each questions.slice(0, 4) as q}
            <a
              href={`/dashboard/questions/${q.rkey}`}
              class="flex items-center gap-2 px-3 py-2.5 rounded-lg transition-colors duration-200 hover:bg-blue-950/20"
            >
              {#if !q.isRead}
                <span class="w-1.5 h-1.5 rounded-full shrink-0 bg-accent"></span>
              {/if}
              <span class="text-sm truncate text-muted">{q.body}</span>
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
