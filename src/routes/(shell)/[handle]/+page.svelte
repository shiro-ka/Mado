<script lang="ts">
  import { Globe, MessageCircle, Plus } from "lucide-svelte";
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

{#snippet profileCard(profile: { handle?: string; displayName?: string; avatar?: string; description?: string } | null)}
  {@const displayName = profile?.displayName ?? `@${profile?.handle ?? data.cleanHandle}`}
  <div data-suisou-tray data-suisou-item="media">
    {#if profile?.avatar}
      <img
        data-suisou-item="circle large media-figure"
        src={profile.avatar}
        alt={profile.handle}
      />
    {:else}
      <div data-suisou-item="circle large media-figure">
        {(profile?.handle ?? data.cleanHandle)[0]?.toUpperCase() ?? "?"}
      </div>
    {/if}
    <div data-suisou-item="media-content">
      <h1 data-suisou-text="fs-20 fw-700">{displayName}</h1>
      <p data-suisou-text="fs-14" class="sub">@{profile?.handle ?? data.cleanHandle}</p>
      {#if profile?.description}
        <p data-suisou-text="fs-14" class="sub doc">{profile.description}</p>
      {/if}
      <a
        data-suisou-layout="row"
        data-suisou-text="fs-12 link"
        class="accent"
        href={`https://bsky.app/profile/${profile?.handle ?? data.cleanHandle}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        <Globe data-suisou-text="fs-16" />
        Blueskyで見る
      </a>
    </div>
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
      {@render profileCard(detail.profile)}

      {@render listHead(` (${detail.openBoxes.length})`)}

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
            <QuestionBoxCard
              {box}
              ownerHandle={detail.profile?.handle ?? data.cleanHandle}
              isMain={box.rkey === detail.mainBoxRkey}
            />
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
      {@render profileCard(detail.profile)}

      {#if detail.box}
        <div data-suisou-layout="stack gap-3" class="others">
          <div data-suisou-layout="row">
            <MessageCircle data-suisou-text="fs-16" data-suisou="note" />
            <h2 data-suisou-text="fs-14 fw-700" class="sub">メインの窓</h2>
          </div>
          <BoxSendView
            embedded
            box={detail.box}
            ownerProfile={detail.profile}
            cleanHandle={data.cleanHandle}
            ownerRegistered={detail.ownerRegistered}
            session={data.session}
          />
        </div>
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
</style>
