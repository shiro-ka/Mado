<script lang="ts">
  import { Globe, MessageCircle, Plus, Settings2 } from "lucide-svelte";
  import Button from "$lib/components/ui/button/button.svelte";
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
      <MessageCircle data-suisou-icon="small sub" />
      <h2 data-suisou-text="s14 w700" class="sub">窓{count}</h2>
    </div>
    <a href={`/@${data.cleanHandle}/new`}>
      <Button variant="default">
        {#snippet leftIcon()}<Plus />{/snippet}
        新しい窓を作る
      </Button>
    </a>
  </div>
{/snippet}

{#if data.isOwner}
  <!-- Owner: manage view — profile + box list with the main box pinned -->
  <div data-suisou-layout="stack container gap-3" class="page">
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
      <div data-suisou-surface="panel" data-suisou-media>
        {#if detail.profile?.avatar}
          <img
            data-suisou-avatar="large"
            data-suisou-media-icon
            src={detail.profile.avatar}
            alt={detail.profile.handle}
          />
        {:else}
          <div data-suisou-avatar="large" data-suisou-media-icon>
            {(detail.profile?.handle ?? data.cleanHandle)[0]?.toUpperCase() ?? "?"}
          </div>
        {/if}
        <div data-suisou-media-content>
          <h1 data-suisou-text="s20 w700">{displayName}</h1>
          <p data-suisou-text="s14" class="sub">@{detail.profile?.handle ?? data.cleanHandle}</p>
          {#if detail.profile?.description}
            <p data-suisou-text="s14 doc" class="sub">{detail.profile.description}</p>
          {/if}
          <a
            data-suisou-layout="row"
            data-suisou-text="s12"
            data-suisou-link
            class="accent"
            href={`https://bsky.app/profile/${detail.profile?.handle ?? data.cleanHandle}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Globe data-suisou-icon="small" />
            Blueskyで見る
          </a>
        </div>
      </div>

      {@render listHead(` (${detail.openBoxes.length}件)`)}

      {#if detail.openBoxes.length === 0}
        <div data-suisou-surface="panel empty" data-suisou-layout="stack" class="empty">
          <p data-suisou-text="s14" class="sub">まだ窓がありません</p>
          <a href={`/@${data.cleanHandle}/new`}>
            <Button variant="default">
              {#snippet leftIcon()}<Plus />{/snippet}
              最初の窓を作る
            </Button>
          </a>
        </div>
      {:else}
        <div data-suisou-layout="stack gap-3" class="items">
          {#each detail.openBoxes as box}
            <!-- ★重ねていた「停止中」タグを外した。QuestionBoxCard が既に
                 受付中／受付停止 を出しており、同じことを2回言っていた。 -->
            <div class="slot">
              <QuestionBoxCard
                {box}
                ownerHandle={detail.profile?.handle ?? data.cleanHandle}
                isMain={box.rkey === detail.mainBoxRkey}
              />
              <a
                data-suisou-button="icon"
                class="gear"
                href={`/@${data.cleanHandle}/${box.slug}`}
                title="設定"
                aria-label="設定"
              >
                <Settings2 data-suisou-icon="small" />
              </a>
            </div>
          {/each}
        </div>
      {/if}
    {/await}
  </div>
{:else}
  <!-- Visitor: send view — main box send form, then the other Mado below -->
  <div data-suisou-layout="stack container gap-3" class="page narrow">
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
      {:else}
        <div data-suisou-surface="panel empty" data-suisou-layout="stack" class="empty">
          <p data-suisou-text="s14" class="sub">現在受付中の窓はありません</p>
        </div>
      {/if}

      {#if detail.subBoxes.length > 0}
        <div data-suisou-layout="stack gap-3" class="others">
          <div data-suisou-layout="row">
            <MessageCircle data-suisou-icon="small sub" />
            <h2 data-suisou-text="s14 w700" class="sub">
              その他のMado ({detail.subBoxes.length})
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
    --suisou-measure: 42rem;
    padding: var(--suisou-space-4) var(--suisou-space-3);
  }
  .narrow {
    --suisou-measure: 32rem;
  }
  .others {
    margin-block-start: var(--suisou-space-4);
  }
  .empty {
    align-items: center;
    padding: var(--suisou-space-4);
  }
  .sub {
    color: var(--suisou-text-sub);
  }
  .accent {
    color: var(--suisou-accent);
  }

  /* 設定への近道。カードの上に重ねるので、位置だけ現場が持つ */
  .slot {
    position: relative;
  }
  .gear {
    position: absolute;
    top: var(--suisou-space-2);
    inset-inline-end: var(--suisou-space-2);
    opacity: 0;
    transition: opacity var(--suisou-motion-fast) var(--suisou-ease);
  }
  .slot:hover .gear,
  .gear:focus-visible {
    opacity: 1;
  }
</style>
