<script lang="ts">
  import { Home, MessageSquare, Inbox, ChevronRight, Plus, AlertTriangle } from "lucide-svelte";
  import Button from "$lib/components/ui/button/button.svelte";
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

<div data-suisou-layout="stack container gap-4" class="page">
  <div data-suisou-layout="row" class="head">
    <Home data-suisou-icon="accent" />
    <h1 data-suisou-text="s24 w700">ホーム</h1>
  </div>

  {#if sessionExpiringSoon}
    <div data-suisou-banner="warning" data-suisou-layout="row" role="status">
      <AlertTriangle data-suisou-icon="warning" />
      <p data-suisou-layout="grow" data-suisou-text="s14">
        セッションがあと{sessionDaysLeft}日で期限切れになります。
      </p>
      <a data-suisou-link data-suisou-text="s12" href="/auth/login">再ログイン</a>
    </div>
  {/if}

  <!-- ★数字の色分け（青/緑）はやめた。3枚とも同じ「数」なので、色に意味が無く
       Suisou の意味色（success/warning/error）とも食い違っていた。 -->
  <div data-suisou-layout="even gap-3" class="stats">
    {#each [
      { label: "開いた窓", value: boxes.length, unit: "個" },
      { label: "未読の声", value: unreadCount, unit: "件" },
      { label: "声の返信", value: replyCount, unit: "回" },
    ] as stat}
      <div data-suisou-surface="panel" data-suisou-layout="stack">
        <p data-suisou-text="s12 w500" class="sub">{stat.label}</p>
        <p class="value">
          <span data-suisou-text="s24 md:s28 w700 tabular" class="num">{stat.value}</span>
          <span data-suisou-text="s12" class="sub">{stat.unit}</span>
        </p>
      </div>
    {/each}
  </div>

  <div data-suisou-layout="stack md:even gap-3" class="panes">
    <!-- 窓 -->
    <div data-suisou-surface="panel" data-suisou-layout="stack gap-3" class="pane">
      <div data-suisou-layout="row between">
        <div data-suisou-layout="row">
          <MessageSquare data-suisou-icon="small accent" />
          <h2 data-suisou-text="s14 w700">窓</h2>
        </div>
        <a href={`/@${session.handle}`}>
          <Button variant="ghost">
            すべて見る
            {#snippet rightIcon()}<ChevronRight />{/snippet}
          </Button>
        </a>
      </div>

      {#if boxes.length === 0}
        <!-- ★空表示は surface="empty"（破線）。Suisou には Mado の4現場から昇格した値。 -->
        <div data-suisou-surface="panel empty" data-suisou-layout="stack" class="empty">
          <p data-suisou-text="s14" class="sub">まだ窓がありません</p>
          <a href={`/@${session.handle}/new`}>
            <Button variant="default">
              {#snippet leftIcon()}<Plus />{/snippet}
              作成する
            </Button>
          </a>
        </div>
      {:else}
        <div data-suisou-layout="stack">
          {#each boxes.slice(0, 3) as box}
            <a data-suisou-row data-suisou-layout="row between" href={`/@${session.handle}/${box.slug}`}>
              <span data-suisou-text="s14 one-line" class="title">{box.title}</span>
              <span data-suisou-text="s12" class={box.isOpen ? "ok" : "sub"}>
                {box.isOpen ? "受付中" : "停止中"}
              </span>
            </a>
          {/each}
        </div>
      {/if}
    </div>

    <!-- 受信トレイ -->
    <div data-suisou-surface="panel" data-suisou-layout="stack gap-3" class="pane">
      <div data-suisou-layout="row between">
        <div data-suisou-layout="row">
          <Inbox data-suisou-icon="small success" />
          <h2 data-suisou-text="s14 w700">受信トレイ</h2>
          {#if unreadCount > 0}
            <span data-suisou-tag="accent">{unreadCount}</span>
          {/if}
        </div>
        <a href="/receive">
          <Button variant="ghost">
            すべて見る
            {#snippet rightIcon()}<ChevronRight />{/snippet}
          </Button>
        </a>
      </div>

      {#if questions.length === 0}
        <div data-suisou-surface="panel empty" data-suisou-layout="stack" class="empty">
          <p data-suisou-text="s14" class="sub">まだ声が届いていません</p>
          <p data-suisou-text="s12" class="sub">窓のURLをシェアしましょう</p>
        </div>
      {:else}
        <div data-suisou-layout="stack">
          {#each questions.slice(0, 4) as q}
            <a data-suisou-row data-suisou-layout="row" href={questionHref(q)}>
              {#if !q.isRead}<span class="dot"></span>{/if}
              <span data-suisou-layout="grow" data-suisou-text="s14 one-line" class="title sub">{q.body}</span>
              <span data-suisou-text="s12 tabular" class="date">
                {new Date(q.createdAt).toLocaleDateString("ja-JP")}
              </span>
            </a>
          {/each}
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .page {
    --suisou-measure: 56rem;
    padding: var(--suisou-space-4) var(--suisou-space-3);
  }
  .empty {
    align-items: center;
    padding-block: var(--suisou-space-4);
  }

  .value {
    text-align: end;
  }
  .num {
    color: var(--suisou-accent);
  }

  .sub {
    color: var(--suisou-text-sub);
  }
  .ok {
    color: var(--suisou-success);
  }
  .date {
    color: var(--suisou-text-sub);
    flex: none;
  }
  .dot {
    flex: none;
    width: 0.375rem;
    height: 0.375rem;
    border-radius: var(--suisou-radius-pill);
    background: var(--suisou-accent);
  }
</style>
