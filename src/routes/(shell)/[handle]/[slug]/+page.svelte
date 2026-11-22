<script lang="ts">
  import { profilePath, boxPath, ogImagePath } from "$lib/urls.js";
  import { ArrowLeft, Settings } from "lucide-svelte";
  import Button from "$lib/components/ui/Button.svelte";
  import BoxSendView from "$lib/components/mado/BoxSendView.svelte";
  import InboxList from "$lib/components/mado/InboxList.svelte";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  const ownerName = $derived(data.ownerProfile?.displayName || data.cleanHandle);
</script>

<svelte:head>
  <title>{data.box.title} - {ownerName}の窓 | Mado</title>
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="Mado" />
  <meta property="og:title" content={`${data.box.title} - ${ownerName}の窓`} />
  <meta property="og:description" content={data.box.description || "Madoで半匿名の声を送ろう"} />
  <meta property="og:url" content={data.origin + boxPath(data.cleanHandle, data.box.slug)} />
  <meta property="og:image" content={data.origin + ogImagePath(boxPath(data.cleanHandle, data.box.slug), data.cardVersion)} />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:image" content={data.origin + ogImagePath(boxPath(data.cleanHandle, data.box.slug), data.cardVersion)} />
</svelte:head>

<div data-suisou-layout="stack gap-3" data-suisou="container-s py-4 px-3">
  {#if data.isOwner}
    <div>
      <Button href={profilePath(data.cleanHandle)} variant="ghost">
        {#snippet leftIcon()}<ArrowLeft />{/snippet}
        プロフィールに戻る
      </Button>
    </div>
    <div data-suisou-layout="row between">
      <h1 data-suisou-text="fs-24 fw-700 break" class="title">{data.box.title}</h1>
      <Button href={`${boxPath(data.cleanHandle, data.box.slug)}/settings`} variant="ghost">
        {#snippet leftIcon()}<Settings />{/snippet}
        設定
      </Button>
    </div>
    <InboxList inbox={data.inbox} ownerAvatar={data.session?.avatar} showBoxTitle={false} />
  {:else}
    <div>
      <Button variant="ghost" href={profilePath(data.cleanHandle)}>
        {#snippet leftIcon()}<ArrowLeft />{/snippet}
        プロフィールに戻る
      </Button>
    </div>

    <BoxSendView
      box={data.box}
      ownerProfile={data.ownerProfile}
      cleanHandle={data.cleanHandle}
      ownerRegistered={data.ownerRegistered}
      session={data.session}
    />
  {/if}
</div>

<style>
  .title {
    flex: 0 1 auto;
    min-width: 0;
  }
</style>
