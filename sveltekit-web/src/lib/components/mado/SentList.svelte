<script lang="ts">
  import { untrack } from "svelte";
  import { ChevronDown, ChevronUp, Send, MessageCircle, Clock } from "lucide-svelte";
  import { cn, formatDateFull } from "$lib/utils.js";
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
    await fetch("/api/sent/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ownerDid, koeRkey }),
    }).catch(() => {});
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

<div>
  <!-- Tabs -->
  <div class="flex gap-1 mb-5 p-1 rounded-xl bg-elevated">
    {#each tabs as t}
      <button
        onclick={() => (tab = t.id)}
        class={cn(
          "flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer",
          tab === t.id
            ? "bg-surface text-primary shadow-[0_1px_3px_rgba(0,0,0,0.2)]"
            : "bg-transparent text-subtle"
        )}
      >
        {t.label}
        {#if t.id === "all" && items.length > 0}
          <span class={cn("text-xs px-1.5 py-0.5 rounded-full", "bg-elevated text-subtle")}>
            {items.length}
          </span>
        {:else if t.id === "unread" && unreadCount > 0}
          <span class={cn("text-xs px-1.5 py-0.5 rounded-full", tab !== "unread" ? "bg-accent text-white" : "bg-elevated text-subtle")}>
            {unreadCount}
          </span>
        {/if}
      </button>
    {/each}
  </div>

  <!-- List -->
  {#if filtered.length === 0}
    <div class="text-center py-16 flex flex-col items-center gap-3">
      <div class="w-12 h-12 rounded-2xl flex items-center justify-center bg-elevated">
        {#if tab === "unread"}
          <MessageCircle size={22} class="text-subtle" />
        {:else}
          <Send size={22} class="text-subtle" />
        {/if}
      </div>
      <p class="text-sm text-subtle">
        {tab === "unread" ? "未読の返信はありません" : tab === "read" ? "既読の返信はありません" : "まだ質問を送っていません"}
      </p>
    </div>
  {:else}
    <div class="flex flex-col gap-3">
      {#each filtered as item}
        {@const key = `${item.ref.ownerDid}:${item.ref.koeRkey}`}
        {@const isExpanded = expanded.has(key)}
        {@const hasAnswer = item.answers.length > 0}
        {@const isRead = readSet.has(key)}

        <div
          class={cn(
            "rounded-2xl overflow-hidden bg-surface",
            hasAnswer && !isRead ? "border border-blue-600/40" : "border border-border"
          )}
        >
          <!-- Header -->
          <button
            onclick={() => toggle(key, item.ref.ownerDid, item.ref.koeRkey, hasAnswer)}
            class="w-full text-left p-5 flex flex-col gap-3 cursor-pointer"
          >
            <!-- Meta row -->
            <div class="flex items-center gap-2">
              <Clock size={12} class="text-subtle" />
              <span class="text-xs text-subtle">{formatDateFull(item.ref.sentAt)}</span>
              <div class="flex-1"></div>
              {#if hasAnswer}
                <span
                  class={cn(
                    "text-xs px-2 py-0.5 rounded-full font-medium",
                    isRead
                      ? "bg-elevated text-subtle border border-border"
                      : "bg-blue-600/15 text-blue-400 border border-blue-600/30"
                  )}
                >
                  {isRead ? "返信済み" : "返信あり"}
                </span>
              {/if}
              {#if isExpanded}
                <ChevronUp size={15} class="text-subtle" />
              {:else}
                <ChevronDown size={15} class="text-subtle" />
              {/if}
            </div>

            <!-- Question body -->
            <p class={cn("text-sm leading-relaxed whitespace-pre-wrap text-primary", !isExpanded && "line-clamp-2")}>
              {item.ref.body}
            </p>
          </button>

          <!-- Answers -->
          {#if isExpanded && hasAnswer}
            <div class="px-5 pb-5 flex flex-col gap-3 border-t border-border">
              <p class="text-xs font-medium pt-4 text-subtle">返信（{item.answers.length}件）</p>
              {#each item.answers as answer}
                <div class="rounded-xl p-4 bg-elevated">
                  <div class="flex items-center gap-2 mb-2">
                    <div class="w-5 h-5 rounded-full flex items-center justify-center bg-accent-light">
                      <MessageCircle size={10} class="text-accent" />
                    </div>
                    <span class="text-xs text-muted">{formatDateFull(answer.createdAt)}</span>
                  </div>
                  <p class="text-sm leading-relaxed whitespace-pre-wrap text-primary">{answer.body}</p>
                </div>
              {/each}
            </div>
          {/if}

          {#if isExpanded && !hasAnswer}
            <div class="px-5 pb-5 pt-4 border-t border-border">
              <p class="text-sm text-subtle">まだ返信がありません</p>
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</div>
