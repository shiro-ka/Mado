<script lang="ts">
  import { Inbox } from "lucide-svelte";
  import { page } from "$app/state";
  import { untrack } from "svelte";
  import QuestionCard from "$lib/components/mado/QuestionCard.svelte";
  import Skeleton from "$lib/components/ui/Skeleton.svelte";
  import Button from "$lib/components/ui/Button.svelte";
  import type { FilterTab, InboxItem } from "$lib/../types/index.js";

  interface Props {
    inbox: Promise<{ allQuestions: InboxItem[] }>;
    ownerAvatar?: string;
  }

  let { inbox, ownerAvatar }: Props = $props();

  const tab = $derived((page.url.searchParams.get("tab") ?? "new") as FilterTab);

  const tabs: { key: FilterTab; label: string }[] = [
    { key: "new", label: "新しい声" },
    { key: "heard", label: "聞いた声" },
    { key: "all", label: "すべて" },
  ];

  type Handled = "replied" | "through" | "unheard";
  let handled = $state(new Map<string, Handled>());
  let undoing = $state<string | null>(null);
  let sentAnswers = $state(new Map<string, string[]>());
  let deleted = $state(new Set<string>());
  let blocked = $state(new Set<string>());

  function setHandled(rkey: string, kind: Handled) {
    handled = new Map(handled).set(rkey, kind);
  }

  function isHeard(q: { rkey: string; isRead: boolean }) {
    const kind = handled.get(q.rkey);
    return kind ? kind !== "unheard" : q.isRead;
  }

  const settled = $derived.by(() => {
    tab;
    return untrack(() => new Map([...handled].map(([rkey, kind]) => [rkey, kind !== "unheard"])));
  });

  function inHeardTab(q: { rkey: string; isRead: boolean }) {
    return settled.get(q.rkey) ?? q.isRead;
  }


  async function undoThrough(rkey: string) {
    undoing = rkey;
    try {
      const res = await fetch(`/api/questions/${rkey}/handled`, { method: "DELETE" });
      if (res.ok) setHandled(rkey, "unheard");
    } finally {
      undoing = null;
    }
  }
</script>

{#await inbox}
  <div data-suisou-layout="row">
    {#each tabs as t}
      <span data-suisou-button aria-current={tab === t.key ? "page" : undefined}>
        {t.label}
        {#if t.key !== "all"}
          <span data-suisou-item="tag" class="ghost">0</span>
        {/if}
      </span>
    {/each}
  </div>
  <div data-suisou-layout="stack gap-3" class="items">
    {#each Array(4) as _}
      <Skeleton height="5rem" />
    {/each}
  </div>
{:then inbox}
  {@const allQuestions = inbox.allQuestions.filter(
    (q) => !deleted.has(q.rkey) && !(q.senderDid && blocked.has(q.senderDid)),
  )}
  {@const newCount = allQuestions.filter((q) => !isHeard(q)).length}
  {@const heardCount = allQuestions.length - newCount}
  {@const filtered = allQuestions.filter((q) => {
    if (tab === "new") return !inHeardTab(q);
    if (tab === "heard") return inHeardTab(q);
    return true;
  })}

  <div data-suisou-layout="row">
    {#each tabs as t}
      <a
        data-suisou-button
        href={`?tab=${t.key}`}
        aria-current={tab === t.key ? "page" : undefined}
      >
        {t.label}
        {#if t.key === "new"}
          <span data-suisou-item="tag" data-suisou="accent">{newCount}</span>
        {:else if t.key === "heard"}
          <span data-suisou-item="tag">{heardCount}</span>
        {/if}
      </a>
    {/each}
  </div>

  {#if filtered.length === 0}
    <div data-suisou-tray data-suisou-layout="stack gap-3 center" data-suisou-text="center" data-suisou="bd-dash p-4" class="empty">
      <Inbox data-suisou-text="fs-20" data-suisou="note" class="big" />
      <div data-suisou-layout="stack gap-1 center">
        {#if tab === "all"}
          <p data-suisou-text="fs-16 fw-700">声がありません</p>
          <p data-suisou-text="fs-14" data-suisou="note">窓のURLをシェアして声を募りましょう</p>
        {:else}
          <p data-suisou-text="fs-16 fw-700">声が届くのを待っています...</p>
        {/if}
      </div>
    </div>
  {:else}
    <div data-suisou-layout="stack gap-3" class="items">
      {#each filtered as question (question.rkey)}
        {#if tab === "new" && handled.get(question.rkey) === "through"}
          <div data-suisou-tray data-suisou-layout="row between" data-suisou="py-1">
            <span data-suisou-text="fs-14" data-suisou="note">既読にしました</span>
            <Button variant="ghost" loading={undoing === question.rkey} onclick={() => undoThrough(question.rkey)}>取り消す</Button>
          </div>
        {:else}
          <QuestionCard
            {question}
            href={question.href}
            heard={isHeard(question)}
            {ownerAvatar}
            showNewTag={tab !== "new" && !isHeard(question)}
            sentAnswers={sentAnswers.get(question.rkey)}
            onReplied={(answerBody) => {
              setHandled(question.rkey, "replied");
              sentAnswers = new Map(sentAnswers).set(question.rkey, [...(sentAnswers.get(question.rkey) ?? []), answerBody]);
            }}
            onThrough={() => setHandled(question.rkey, "through")}
            onUnheard={() => setHandled(question.rkey, "unheard")}
            onBlocked={(did) => (blocked = new Set([...blocked, did]))}
            onDeleted={() => (deleted = new Set([...deleted, question.rkey]))}
          />
        {/if}
      {/each}
    </div>
  {/if}
{/await}

<style>
  .ghost {
    visibility: hidden;
  }
  .empty :global(.big) {
    width: 2.25rem;
    height: 2.25rem;
  }
</style>
