<script lang="ts">
  import { Globe, MessageCircle, Plus, Settings2 } from "lucide-svelte";
  import Button from "$lib/components/ui/Button.svelte";
  import QuestionBoxCard from "$lib/components/mado/QuestionBoxCard.svelte";
  import BoxSendView from "$lib/components/mado/BoxSendView.svelte";
  import Skeleton from "$lib/components/ui/Skeleton.svelte";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
</script>

<svelte:head>
  <title>@{data.cleanHandle} の窓 | Mado</title>
</svelte:head>

{#snippet listHead(count: string)}
  <div data-suisou-layout="row between">
    <div data-suisou-layout="row">
      <MessageCircle data-suisou-text="fs-16" data-suisou="note" />
      <h2 data-suisou-text="fs-14 fw-700" class="sub">窓{count}</h2>
    </div>
    <Button href={`/@${data.cleanHandle}/new`} variant="default">
      {#snippet leftIcon()}<Plus />{/snippet}
      新しい窓を開ける
    </Button>
  </div>
{/snippet}

{#if data.isOwner}
  <div data-suisou-layout="stack gap-3" data-suisou="container-s" class="page">
    {#await data.detail}
      <Skeleton height="7rem" />
      {@render listHead("")}
      <div data-suisou-layout="stack gap-3" class="items">
        {#each Array(2) as _}
          <Skeleton height="6rem" />
        {/each}
      </div>
    {:then detail}
      {@const displayName = detail.profile?.displayName ?? `@${detail.profile?.handle ?? data.cleanHandle}`}
      <div data-suisou-tray data-suisou-item="media">
        {#if detail.profile?.avatar}
          <img
            data-suisou-item="circle large media-figure"
            src={detail.profile.avatar}
            alt={detail.profile.handle}
          />
        {:else}
          <div data-suisou-item="circle large media-figure">
            {(detail.profile?.handle ?? data.cleanHandle)[0]?.toUpperCase() ?? "?"}
          </div>
        {/if}
        <div data-suisou-item="media-content">
          <h1 data-suisou-text="fs-20 fw-700">{displayName}</h1>
          <p data-suisou-text="fs-14" class="sub">@{detail.profile?.handle ?? data.cleanHandle}</p>
          {#if detail.profile?.description}
            <p data-suisou-text="fs-14" class="sub doc">{detail.profile.description}</p>
          {/if}
          <a
            data-suisou-layout="row"
            data-suisou-text="fs-12 link"
            class="accent"
            href={`https://bsky.app/profile/${detail.profile?.handle ?? data.cleanHandle}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Globe data-suisou-text="fs-16" />
            Blueskyで見る
          </a>
        </div>
      </div>

      {@render listHead(` (${detail.openBoxes.length}件)`)}

      {#if detail.openBoxes.length === 0}
        <div data-suisou-tray data-suisou-layout="stack center" data-suisou="bd-dash" class="empty">
          <p data-suisou-text="fs-14" class="sub">まだ窓がありません</p>
          <Button href={`/@${data.cleanHandle}/new`} variant="default">
            {#snippet leftIcon()}<Plus />{/snippet}
            最初の窓を開ける
          </Button>
        </div>
      {:else}
        <div data-suisou-layout="stack gap-3" class="items">
          {#each detail.openBoxes as box}
            <div class="slot">
              <QuestionBoxCard
                {box}
                ownerHandle={detail.profile?.handle ?? data.cleanHandle}
                isMain={box.rkey === detail.mainBoxRkey}
              />
              <a
                data-suisou-button="icon"
                class="gear"
                href={`/@${data.cleanHandle}/${box.slug}/settings`}
                title="設定"
                aria-label="設定"
              >
                <Settings2 data-suisou-text="fs-16" />
              </a>
            </div>
          {/each}
        </div>
      {/if}
    {/await}
  </div>
{:else}
  <div data-suisou-layout="stack gap-3" data-suisou="container-s" class="page">
    {#await data.detail}
      <Skeleton height="16rem" />
    {:then detail}
      {#if detail.box}
        <BoxSendView
          box={detail.box}
          ownerProfile={detail.profile}
          cleanHandle={data.cleanHandle}
          ownerRegistered={detail.ownerRegistered}
          session={data.session}
        />
      {:else if detail.subBoxes.length === 0}
        <div data-suisou-tray data-suisou-layout="stack center" data-suisou="bd-dash" class="empty">
          <p data-suisou-text="fs-14" class="sub">現在受付中の窓はありません</p>
        </div>
      {/if}

      {#if detail.subBoxes.length > 0}
        <div data-suisou-layout="stack gap-3" class="others">
          <div data-suisou-layout="row">
            <MessageCircle data-suisou-text="fs-16" data-suisou="note" />
            <h2 data-suisou-text="fs-14 fw-700" class="sub">
              {detail.box ? "その他の窓" : "窓"} ({detail.subBoxes.length})
            </h2>
          </div>
          <div data-suisou-layout="stack gap-3" class="items">
            {#each detail.subBoxes as box}
              <QuestionBoxCard {box} ownerHandle={detail.profile?.handle ?? data.cleanHandle} />
            {/each}
          </div>
        </div>
      {/if}
    {/await}
  </div>
{/if}

<style>
  .page {
    padding: var(--suisou-space-4) var(--suisou-space-3);
  }
  .others {
    margin-block-start: var(--suisou-space-4);
  }
  .empty {
    padding: var(--suisou-space-4);
  }
  .sub {
    color: var(--suisou-color-text-note);
  }
  .accent {
    color: var(--suisou-color-accent);
  }

  .slot {
    position: relative;
  }
  .gear {
    position: absolute;
    top: var(--suisou-space-2);
    inset-inline-end: var(--suisou-space-2);
    opacity: 0;
    transition: opacity var(--suisou-duration-fast) var(--suisou-ease);
  }
  .slot:hover .gear,
  .gear:focus-visible {
    opacity: 1;
  }
</style>
