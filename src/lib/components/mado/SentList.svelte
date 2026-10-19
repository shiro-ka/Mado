<script lang="ts">
  import { untrack } from "svelte";
  import { ChevronDown, ChevronUp, Send, MessageCircle, Clock } from "lucide-svelte";
  import { formatDateFull } from "$lib/utils.js";
  import type { SentRef, Answer } from "$lib/../types/index.js";

  export interface SentItem {
    ref: SentRef;
    koeUri: string;
    answers: Answer[];
    isRead: boolean;
  }

  interface Props {
    items: SentItem[];
  }

  let { items }: Props = $props();

  type Tab = "all" | "unread" | "read";
  let tab = $state<Tab>("all");
  let expanded = $state(new Set<string>());
  const initialReadKeys = untrack(() =>
    items.filter((i) => i.isRead).map((i) => `${i.ref.ownerDid}:${i.ref.koeRkey}`)
  );
  let readSet = $state(new Set(initialReadKeys));

  const filtered = $derived(
    items.filter((item) => {
      const hasAnswer = item.answers.length > 0;
      const isRead = readSet.has(`${item.ref.ownerDid}:${item.ref.koeRkey}`);
      if (tab === "unread") return hasAnswer && !isRead;
      if (tab === "read") return hasAnswer && isRead;
      return true;
    })
  );

  const unreadCount = $derived(
    items.filter((i) => i.answers.length > 0 && !readSet.has(`${i.ref.ownerDid}:${i.ref.koeRkey}`)).length
  );

  async function markRead(ownerDid: string, koeRkey: string) {
    const key = `${ownerDid}:${koeRkey}`;
    if (readSet.has(key)) return;
    readSet = new Set([...readSet, key]);
    try {
      const res = await fetch("/api/sent/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ownerDid, koeRkey }),
      });
      if (!res.ok) throw new Error();
    } catch {
      const next = new Set(readSet);
      next.delete(key);
      readSet = next;
    }
  }

  function toggle(key: string, ownerDid: string, koeRkey: string, hasAnswer: boolean) {
    const next = new Set(expanded);
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
      if (hasAnswer) markRead(ownerDid, koeRkey);
    }
    expanded = next;
  }

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: "all", label: "すべて" },
    { id: "unread", label: "未読" },
    { id: "read", label: "既読" },
  ];
</script>

<div data-suisou-layout="stack gap-3" class="list">
  <div data-suisou-tray data-suisou-layout="row gap-0">
    {#each tabs as t}
      <button
        data-suisou-button
        data-suisou-layout="grow"
        aria-pressed={tab === t.id}
        onclick={() => (tab = t.id)}
      >
        {t.label}
        {#if t.id === "all" && items.length > 0}
          <span data-suisou-item="tag">{items.length}</span>
        {:else if t.id === "unread" && unreadCount > 0}
          <span data-suisou-item="tag" data-suisou={tab === "unread" ? undefined : "accent"}>{unreadCount}</span>
        {/if}
      </button>
    {/each}
  </div>

  {#if filtered.length === 0}
    <div data-suisou-tray data-suisou-layout="stack center" data-suisou="bd-dash" class="empty">
      <span data-suisou-item="square">
        {#if tab === "unread"}
          <MessageCircle data-suisou-text="fs-20" data-suisou="note" />
        {:else}
          <Send data-suisou-text="fs-20" data-suisou="note" />
        {/if}
      </span>
      <p data-suisou-text="fs-14" class="sub">
        {tab === "unread" ? "未読の返信はありません" : tab === "read" ? "既読の返信はありません" : "まだ声を送っていません"}
      </p>
    </div>
  {:else}
    <div data-suisou-layout="stack gap-3" class="items">
      {#each filtered as item}
        {@const key = `${item.ref.ownerDid}:${item.ref.koeRkey}`}
        {@const isExpanded = expanded.has(key)}
        {@const hasAnswer = item.answers.length > 0}
        {@const isRead = readSet.has(key)}

        <div
          data-suisou-tray
          data-suisou="p-0"
          class="item"
          class:fresh={hasAnswer && !isRead}
        >
          <button
            data-suisou-layout="stack"
            data-suisou-text="start"
            class="head"
            onclick={() => toggle(key, item.ref.ownerDid, item.ref.koeRkey, hasAnswer)}
          >
            <div data-suisou-layout="row">
              <Clock data-suisou-text="fs-16" data-suisou="note" />
              <span data-suisou-text="fs-12" class="sub">{formatDateFull(item.ref.sentAt)}</span>
              <span data-suisou-layout="grow"></span>
              {#if hasAnswer}
                <span data-suisou-item="tag" data-suisou={isRead ? undefined : "accent"}>
                  {isRead ? "返信済み" : "返信あり"}
                </span>
              {/if}
              {#if isExpanded}
                <ChevronUp data-suisou-text="fs-16" data-suisou="note" />
              {:else}
                <ChevronDown data-suisou-text="fs-16" data-suisou="note" />
              {/if}
            </div>

            <p data-suisou-text="fs-14" class="body doc" class:clamp={!isExpanded}>
              {item.ref.body}
            </p>
          </button>

          {#if isExpanded && hasAnswer}
            <div data-suisou-layout="stack" data-suisou="bd-top" class="answers">
              <p data-suisou-text="fs-12 fw-500" class="sub">返信（{item.answers.length}件）</p>
              {#each item.answers as answer}
                <div data-suisou-item data-suisou-layout="stack">
                  <div data-suisou-layout="row">
                    <MessageCircle data-suisou-text="fs-16" data-suisou="accent" />
                    <span data-suisou-text="fs-12" class="sub">{formatDateFull(answer.createdAt)}</span>
                  </div>
                  <p data-suisou-text="fs-14" class="body doc">{answer.body}</p>
                </div>
              {/each}
            </div>
          {:else if isExpanded}
            <div data-suisou="bd-top" class="answers">
              <p data-suisou-text="fs-14" class="sub">まだ返信がありません</p>
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .empty {
    padding-block: var(--suisou-space-4);
  }

  .item.fresh {
    border-color: var(--suisou-color-accent);
  }

  .head {
    width: 100%;
    padding: var(--suisou-space-3);
    border: 0;
    background: transparent;
    font: inherit;
    color: inherit;
    cursor: pointer;
  }
  .answers {
    padding: var(--suisou-space-3);
  }

  .body {
    white-space: pre-wrap;
  }
  .clamp {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    overflow: hidden;
  }
  .sub {
    color: var(--suisou-color-text-note);
  }
</style>
