<script lang="ts">
  import { Globe, MessageCircle, Plus, Settings2 } from "lucide-svelte";
  import Button from "$lib/components/ui/Button.svelte";
  import Badge from "$lib/components/ui/Badge.svelte";
  import QuestionBoxCard from "$lib/components/mado/QuestionBoxCard.svelte";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
</script>

<svelte:head>
  <title>{data.profile?.displayName ?? `@${data.profile?.handle ?? data.cleanHandle}`} の質問箱 | Mado</title>
</svelte:head>

<div class="px-4 py-10">
  <div class="mx-auto max-w-2xl">
    <!-- Profile header -->
    <div class="rounded-2xl p-6 mb-6 flex items-start gap-4 bg-surface border border-border">
      {#if data.profile?.avatar}
        <img
          src={data.profile.avatar}
          alt={data.profile.handle}
          class="w-16 h-16 rounded-full object-cover shrink-0"
        />
      {:else}
        <div class="w-16 h-16 rounded-full flex items-center justify-center shrink-0 font-bold text-2xl bg-accent text-white">
          {(data.profile?.handle ?? data.cleanHandle)[0]?.toUpperCase() ?? "?"}
        </div>
      {/if}
      <div class="flex-1 min-w-0">
        <h1 class="text-xl font-bold text-primary">
          {data.profile?.displayName ?? `@${data.profile?.handle ?? data.cleanHandle}`}
        </h1>
        <p class="text-sm mt-0.5 text-muted">@{data.profile?.handle ?? data.cleanHandle}</p>
        {#if data.profile?.description}
          <p class="text-sm mt-2 leading-relaxed text-muted">{data.profile.description}</p>
        {/if}
        <a
          href={`https://bsky.app/profile/${data.profile?.handle ?? data.cleanHandle}`}
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-1 mt-2 text-xs hover:opacity-80 transition-opacity text-blue-400"
        >
          <Globe size={11} />
          Blueskyで見る
        </a>
      </div>
    </div>

    <!-- Box list header -->
    <div class="mb-3 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <MessageCircle size={16} class="text-subtle" />
        <h2 class="text-sm font-semibold text-muted">
          質問箱 ({data.openBoxes.length}件)
        </h2>
      </div>
      {#if data.isOwner}
        <a href={`/@${data.cleanHandle}/new`}>
          <Button size="sm">
            {#snippet leftIcon()}<Plus size={14} />{/snippet}
            新しい窓を作る
          </Button>
        </a>
      {/if}
    </div>

    {#if data.openBoxes.length === 0}
      <div class="rounded-2xl p-10 text-center bg-surface border border-dashed border-border-strong">
        {#if data.isOwner}
          <p class="text-sm mb-3 text-muted">まだ質問箱がありません</p>
          <a href={`/@${data.cleanHandle}/new`}>
            <Button size="sm">
              {#snippet leftIcon()}<Plus size={14} />{/snippet}
              最初の窓を作る
            </Button>
          </a>
        {:else}
          <p class="text-sm text-muted">現在受付中の質問箱はありません</p>
        {/if}
      </div>
    {:else}
      <div class="flex flex-col gap-3">
        {#each data.openBoxes as box}
          <div class="relative group">
            <QuestionBoxCard {box} ownerHandle={data.profile?.handle ?? data.cleanHandle} />
            {#if data.isOwner}
              <div class="absolute top-3 right-10 flex items-center gap-1.5">
                {#if !box.isOpen}
                  <Badge variant="muted" size="sm">停止中</Badge>
                {/if}
              </div>
              <a
                href={`/@${data.cleanHandle}/${box.slug}`}
                class="absolute top-3 right-3 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity bg-elevated text-subtle hover:text-primary"
                title="設定"
              >
                <Settings2 size={13} />
              </a>
            {/if}
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>
