<script lang="ts">
  import { Globe, MessageCircle, Plus, Settings2 } from "lucide-svelte";
  import Button from "$lib/components/ui/button/button.svelte";
  import { Badge } from "$lib/components/ui/badge";
  import QuestionBoxCard from "$lib/components/mado/QuestionBoxCard.svelte";
  import BoxSendView from "$lib/components/mado/BoxSendView.svelte";
  import Skeleton from "$lib/components/ui/Skeleton.svelte";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
</script>

<svelte:head>
  <title>@{data.cleanHandle} の窓 | Mado</title>
</svelte:head>

{#if data.isOwner}
  <!-- Owner: manage view — profile + box list with the main box pinned -->
  <div class="px-4 py-10">
    <div class="mx-auto max-w-2xl">
      {#await data.detail}
        <Skeleton class="h-28 mb-6" />
        <div class="mb-3 flex items-center justify-between">
          <div data-suisou-layout="row">
            <MessageCircle size={16} class="text-subtle" />
            <h2 class="font-semibold text-muted-foreground">窓</h2>
          </div>
          <a href={`/@${data.cleanHandle}/new`}>
            <Button size="sm">
              {#snippet leftIcon()}<Plus size={14} />{/snippet}
              新しい窓を作る
            </Button>
          </a>
        </div>
        <div class="flex flex-col gap-3">
          {#each Array(2) as _}
            <Skeleton class="h-24" />
          {/each}
        </div>
      {:then detail}
        {@const displayName = detail.profile?.displayName ?? `@${detail.profile?.handle ?? data.cleanHandle}`}
        <!-- Profile header -->
        <div data-suisou-surface="panel" class="p-6 mb-6 flex items-start gap-4">
          {#if detail.profile?.avatar}
            <img
              src={detail.profile.avatar}
              alt={detail.profile.handle}
              class="w-16 h-16 rounded-full object-cover shrink-0"
            />
          {:else}
            <div class="w-16 h-16 rounded-full flex items-center justify-center shrink-0 font-bold text-2xl bg-primary text-white">
              {(detail.profile?.handle ?? data.cleanHandle)[0]?.toUpperCase() ?? "?"}
            </div>
          {/if}
          <div class="flex-1 min-w-0">
            <h1 class="text-xl font-bold text-foreground">{displayName}</h1>
            <p class="mt-0.5 text-muted-foreground">@{detail.profile?.handle ?? data.cleanHandle}</p>
            {#if detail.profile?.description}
              <p class="mt-2 leading-relaxed text-muted-foreground">{detail.profile.description}</p>
            {/if}
            <a
              href={`https://bsky.app/profile/${detail.profile?.handle ?? data.cleanHandle}`}
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
          <div data-suisou-layout="row">
            <MessageCircle size={16} class="text-subtle" />
            <h2 class="font-semibold text-muted-foreground">
              窓 ({detail.openBoxes.length}件)
            </h2>
          </div>
          <a href={`/@${data.cleanHandle}/new`}>
            <Button size="sm">
              {#snippet leftIcon()}<Plus size={14} />{/snippet}
              新しい窓を作る
            </Button>
          </a>
        </div>

        {#if detail.openBoxes.length === 0}
          <div data-suisou-surface="panel empty" class="p-10 text-center">
            <p class="mb-3 text-muted-foreground">まだ窓がありません</p>
            <a href={`/@${data.cleanHandle}/new`}>
              <Button size="sm">
                {#snippet leftIcon()}<Plus size={14} />{/snippet}
                最初の窓を作る
              </Button>
            </a>
          </div>
        {:else}
          <div class="flex flex-col gap-3">
            {#each detail.openBoxes as box}
              <div class="relative group">
                <QuestionBoxCard
                  {box}
                  ownerHandle={detail.profile?.handle ?? data.cleanHandle}
                  isMain={box.rkey === detail.mainBoxRkey}
                />
                <div class="absolute top-3 right-10 flex items-center gap-1.5">
                  {#if !box.isOpen}
                    <Badge variant="muted" size="sm">停止中</Badge>
                  {/if}
                </div>
                <a
                  href={`/@${data.cleanHandle}/${box.slug}`}
                  class="absolute top-3 right-3 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity bg-elevated text-subtle hover:text-foreground"
                  title="設定"
                >
                  <Settings2 size={13} />
                </a>
              </div>
            {/each}
          </div>
        {/if}
      {/await}
    </div>
  </div>
{:else}
  <!-- Visitor: send view — main box send form, then the other Mado below -->
  <div class="px-4 py-10">
    <div class="mx-auto max-w-lg">
      {#await data.detail}
        <Skeleton class="h-64" />
      {:then detail}
        {#if detail.box}
          <BoxSendView
            box={detail.box}
            ownerProfile={detail.profile}
            cleanHandle={data.cleanHandle}
            ownerRegistered={detail.ownerRegistered}
            session={data.session}
          />
        {:else}
          <div data-suisou-surface="panel empty" class="p-10 text-center">
            <p class="text-muted-foreground">現在受付中の窓はありません</p>
          </div>
        {/if}

        {#if detail.subBoxes.length > 0}
          <div class="mt-8">
            <div data-suisou-layout="row" class="mb-3">
              <MessageCircle size={16} class="text-subtle" />
              <h2 class="font-semibold text-muted-foreground">
                その他のMado ({detail.subBoxes.length})
              </h2>
            </div>
            <div class="flex flex-col gap-3">
              {#each detail.subBoxes as box}
                <QuestionBoxCard {box} ownerHandle={detail.profile?.handle ?? data.cleanHandle} />
              {/each}
            </div>
          </div>
        {/if}
      {/await}
    </div>
  </div>
{/if}
