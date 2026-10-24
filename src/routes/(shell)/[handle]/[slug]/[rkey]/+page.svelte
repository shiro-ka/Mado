<script lang="ts">
  import { ArrowLeft, User, ExternalLink, Lock, MessageCircle, Archive, ArchiveRestore } from "lucide-svelte";
  import { invalidateAll } from "$app/navigation";
  import Button from "$lib/components/ui/Button.svelte";
  import AnswerForm from "$lib/components/mado/AnswerForm.svelte";
  import BlockButton from "$lib/components/mado/BlockButton.svelte";
  import DeleteQuestionButton from "$lib/components/mado/DeleteQuestionButton.svelte";
  import { formatDateFull } from "$lib/utils.js";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();


  let toggling = $state(false);
  async function toggleHeard() {
    toggling = true;
    try {
      const res = await fetch(`/api/questions/${data.question.rkey}/handled`, {
        method: data.question.isRead ? "DELETE" : "POST",
      });
      if (res.ok) await invalidateAll();
    } finally {
      toggling = false;
    }
  }
</script>

<svelte:head>
  <title>声 | @{data.cleanHandle} | Mado</title>
  <meta property="og:type" content="article" />
  <meta property="og:site_name" content="Mado" />
  <meta property="og:title" content={`${data.ownerName} への声 - Mado 半匿名メッセージ`} />
  <meta property="og:url" content={`${data.origin}/@${data.cleanHandle}/${data.box.slug}/${data.question.rkey}`} />
  <meta property="og:image" content={`${data.origin}/og/@${data.cleanHandle}/${data.box.slug}/${data.question.rkey}`} />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:image" content={`${data.origin}/og/@${data.cleanHandle}/${data.box.slug}/${data.question.rkey}`} />
</svelte:head>

<div data-suisou-layout="stack gap-3" data-suisou="container-s py-4 px-3">
  <div>
    <Button variant="ghost" href={data.isOwner ? "/receive" : `/@${data.cleanHandle}/${data.box.slug}`}>
      {#snippet leftIcon()}<ArrowLeft />{/snippet}
      {data.isOwner ? "受信トレイに戻る" : "窓に戻る"}
    </Button>
  </div>

  <div data-suisou-tray data-suisou-layout="stack gap-0" data-suisou="p-0" class="card">
    {#if data.isOwner}
      <a href={`/@${data.cleanHandle}/${data.box.slug}`} data-suisou-item="media" data-suisou="bd-bottom py-2 px-4">
        <span data-suisou-item="media-content">
          <span data-suisou-text="fs-14 fw-500">{data.box.title}</span>
          {#if data.box.description}
            <span data-suisou-text="fs-12" data-suisou="note">{data.box.description}</span>
          {/if}
        </span>
      </a>
    {:else}
      <a href={`/@${data.cleanHandle}/${data.box.slug}`} data-suisou-item="media" data-suisou="bd-bottom px-4 py-3" class="owner">
        <span data-suisou-item="media-figure">
          {#if data.ownerAvatar}
            <img src={data.ownerAvatar} alt="" data-suisou-item="circle large" />
          {:else}
            <span data-suisou-item="circle large"><User data-suisou-text="fs-20" /></span>
          {/if}
        </span>
        <span data-suisou-item="media-content">
          <span data-suisou-layout="row gap-1">
            <span data-suisou-text="fs-16 fw-700 clamp-1" class="name">{data.ownerName}</span>
            <span data-suisou-text="fs-12 clamp-1" data-suisou="note" class="handle">@{data.cleanHandle}</span>
          </span>
          <span data-suisou-text="fs-14 fw-500">{data.box.title}</span>
          {#if data.box.description}
            <span data-suisou-text="fs-12" data-suisou="note">{data.box.description}</span>
          {/if}
        </span>
      </a>
    {/if}

    <div data-suisou-layout="stack gap-3" class="inner">
      {#if data.isOwner}
        {#if data.senderUnknown}
          <p data-suisou-item="notice" data-suisou-layout="row" data-suisou="error" role="alert">
            <Lock data-suisou-text="fs-16" />
            送り主を特定できませんでした。
          </p>
        {/if}

        <div data-suisou-item="media" class="sender">
          {#if data.senderProfile?.avatar}
            <img data-suisou-item="circle media-figure" src={data.senderProfile.avatar} alt="" />
          {:else}
            <div data-suisou-item="circle media-figure">
              <User data-suisou-text="fs-16" data-suisou="note" />
            </div>
          {/if}
          <div data-suisou-item="media-content">
            {#if data.senderProfile}
              <p data-suisou-text="fs-14 fw-500 clamp-1">
                {data.senderProfile.displayName ?? data.senderProfile.handle}
              </p>
              <p data-suisou-text="fs-12 clamp-1" data-suisou="note">@{data.senderProfile.handle}</p>
            {:else if data.senderDid}
              <p data-suisou-text="fs-12" data-suisou="note"><code>{data.senderDid}</code></p>
            {:else}
              <p data-suisou-text="fs-14" data-suisou="note">送信者情報なし</p>
            {/if}
          </div>
          {#if data.senderProfile}
            <Button
              data-suisou-item="media-tail"
              icon
              variant="ghost"
              href={`https://bsky.app/profile/${data.senderProfile.handle}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Bluesky のプロフィールを開く"
            >
              <ExternalLink />
            </Button>
          {/if}
        </div>
      {/if}

      <p data-suisou-text="fs-16 pre-line" class="doc">{data.question.body}</p>

      <div data-suisou-layout="row gap-1">
        {#if data.isOwner}
          <span data-suisou-item="tag" data-suisou={data.question.isRead ? undefined : "accent"}>
            {data.question.isRead ? "聞いた声" : "新しい声"}
          </span>
        {/if}
        <span data-suisou-text="fs-12" data-suisou="note">{formatDateFull(data.question.createdAt)}</span>
      </div>
    </div>
  </div>

  {#if data.answers.length > 0}
    <div data-suisou-layout="stack gap-3" class="group">
      <h2 data-suisou-text="fs-14 fw-700">返信済み（{data.answers.length}件）</h2>
      {#each data.answers as answer}
        <div data-suisou-tray data-suisou-layout="stack">
          <div data-suisou-layout="row">
            <MessageCircle data-suisou-text="fs-16" data-suisou="accent" />
            <span data-suisou-text="fs-12 fw-500" data-suisou="note">返信</span>
            <span data-suisou-text="fs-12" data-suisou="note" class="date">{formatDateFull(answer.createdAt)}</span>
          </div>
          <p data-suisou-text="fs-14 pre-line" class="doc">{answer.body}</p>
        </div>
      {/each}
    </div>
  {/if}

  {#if data.isOwner}
    <div data-suisou-tray data-suisou="p-0" class="card reply">
      <AnswerForm
        koeUri={data.koeUri}
        questionBody={data.question.body}
        pageUrl={`${data.origin}/@${data.cleanHandle}/${data.box.slug}/${data.question.rkey}`}
        onSuccess={() => invalidateAll()}
      />
    </div>

    <div data-suisou-layout="row end wrap">
      <Button variant="ghost" loading={toggling} onclick={toggleHeard}>
        {#snippet leftIcon()}{#if data.question.isRead}<ArchiveRestore />{:else}<Archive />{/if}{/snippet}
        {data.question.isRead ? "未読に戻す" : "既読にする"}
      </Button>
      {#if data.senderDid}
        <BlockButton senderDid={data.senderDid} isBlocked={data.senderBlocked} />
      {/if}
      <DeleteQuestionButton rkey={data.question.rkey} />
    </div>
  {/if}
</div>

<style>
  .card {
    overflow: hidden;
  }
  .owner {
    align-items: center;
  }
  .name {
    flex: 0 1 auto;
    min-width: 0;
  }
  .handle {
    flex: 0 1000 auto;
    min-width: 0;
  }
  .inner,
  .reply {
    padding: var(--suisou-space-4);
  }
  .sender {
    align-items: center;
  }
  .date {
    margin-inline-start: auto;
  }
</style>
