<script lang="ts">
  import { ArrowLeft, User, ExternalLink, Lock, MessageCircle } from "lucide-svelte";
  import { invalidateAll } from "$app/navigation";
  import Button from "$lib/components/ui/button/button.svelte";
  import AnswerForm from "$lib/components/mado/AnswerForm.svelte";
  import BlockButton from "$lib/components/mado/BlockButton.svelte";
  import DeleteQuestionButton from "$lib/components/mado/DeleteQuestionButton.svelte";
  import { formatDateFull } from "$lib/utils.js";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
</script>

<svelte:head>
  <title>声 | @{data.cleanHandle} | Mado</title>
  <meta property="og:type" content="article" />
  <meta property="og:site_name" content="Mado" />
  <meta property="og:title" content={`${data.ownerName} への声 - Mado 半匿名メッセージ`} />
  <!-- No og:description: the OG image already renders the question body in full,
       so a text caption would just duplicate it. Image-only card reads cleaner. -->
  <meta property="og:url" content={`${data.origin}/@${data.cleanHandle}/${data.box.slug}/${data.question.rkey}`} />
  <meta property="og:image" content={`${data.origin}/og/@${data.cleanHandle}/${data.box.slug}/${data.question.rkey}`} />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:image" content={`${data.origin}/og/@${data.cleanHandle}/${data.box.slug}/${data.question.rkey}`} />
</svelte:head>

<div data-suisou-layout="stack container" class="page">
  <div>
    <a href={data.isOwner ? "/receive" : `/@${data.cleanHandle}/${data.box.slug}`}>
      <Button variant="ghost">
        {#snippet leftIcon()}<ArrowLeft />{/snippet}
        {data.isOwner ? "受信トレイに戻る" : "窓に戻る"}
      </Button>
    </a>
  </div>

  <!-- 声 -->
  <div data-suisou-surface="panel" data-suisou-layout="stack" class="card">
    <div data-suisou-layout="row between">
      <span data-suisou-tag={data.question.isRead ? "" : "accent"}>
        {data.question.isRead ? "既読" : "未読"}
      </span>
      <span data-suisou-text="s12" class="faint">{formatDateFull(data.question.createdAt)}</span>
    </div>

    <p data-suisou-text="s16 doc" class="body">{data.question.body}</p>

    {#if data.isOwner}
      {#if data.decryptError}
        <p data-suisou-banner="error" data-suisou-layout="row" role="alert">
          <Lock data-suisou-icon="small" />
          送信者の特定に失敗しました。秘密鍵が見つかりません。
        </p>
      {/if}

      <div data-suisou-media class="sender">
        {#if data.senderProfile?.avatar}
          <img
            data-suisou-avatar
            data-suisou-media-icon
            src={data.senderProfile.avatar}
            alt={data.senderProfile.handle}
          />
        {:else}
          <div data-suisou-avatar data-suisou-media-icon>
            <User data-suisou-icon="small sub" />
          </div>
        {/if}
        <div data-suisou-media-content>
          {#if data.senderProfile}
            <p data-suisou-text="s14 w500">
              {data.senderProfile.displayName ?? data.senderProfile.handle}
            </p>
            <p data-suisou-text="s12" class="sub">@{data.senderProfile.handle}</p>
          {:else if data.senderDid}
            <p data-suisou-text="s12" class="did">{data.senderDid}</p>
          {:else}
            <p data-suisou-text="s14" class="sub">送信者情報なし</p>
          {/if}
        </div>
        {#if data.senderProfile}
          <a
            data-suisou-media-tail
            href={`https://bsky.app/profile/${data.senderProfile.handle}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button size="icon"><ExternalLink /></Button>
          </a>
        {/if}
      </div>
    {/if}
  </div>

  <!-- 回答 -->
  {#if data.answers.length > 0}
    <div data-suisou-layout="stack" class="group">
      <h2 data-suisou-text="s14 w700">回答済み（{data.answers.length}件）</h2>
      {#each data.answers as answer}
        <div data-suisou-surface="panel" data-suisou-layout="stack">
          <div data-suisou-layout="row">
            <MessageCircle data-suisou-icon="small accent" />
            <span data-suisou-text="s12 w500" class="sub">回答</span>
            <span data-suisou-text="s12" class="date">{formatDateFull(answer.createdAt)}</span>
          </div>
          <p data-suisou-text="s14 doc" class="body">{answer.body}</p>
        </div>
      {/each}
    </div>
  {/if}

  {#if data.isOwner}
    <div data-suisou-surface="panel" data-suisou-layout="stack" class="card">
      <h2 data-suisou-text="s14 w700">回答を書く</h2>
      <AnswerForm
        koeUri={data.koeUri}
        questionBody={data.question.body}
        pageUrl={`${data.origin}/@${data.cleanHandle}/${data.box.slug}/${data.question.rkey}`}
        onSuccess={() => invalidateAll()}
      />
    </div>

    <!-- 取り返しのつかない操作。手書きの赤い面 → banner="error" -->
    <div data-suisou-banner="error" data-suisou-layout="stack md:row" class="danger">
      <DeleteQuestionButton rkey={data.question.rkey} />
      {#if data.senderDid}
        <BlockButton senderDid={data.senderDid} isBlocked={data.senderBlocked} />
      {/if}
    </div>
  {/if}
</div>

<style>
  .page {
    --suisou-measure: 42rem;
    gap: var(--suisou-space-3);
    padding: var(--suisou-space-4) var(--suisou-space-3);
  }
  .card {
    gap: var(--suisou-space-3);
    padding: var(--suisou-space-4);
  }
  .group {
    gap: var(--suisou-space-3);
  }
  .sender {
    align-items: center;
    padding-block-start: var(--suisou-space-3);
    border-top: 1px solid var(--suisou-line-weak);
  }

  .body {
    white-space: pre-wrap;
  }
  .did {
    font-family: var(--suisou-mono);
    color: var(--suisou-text-disabled);
    word-break: break-all;
  }
  .sub {
    color: var(--suisou-text-sub);
  }
  .faint {
    color: var(--suisou-text-disabled);
  }
  .date {
    margin-inline-start: auto;
    color: var(--suisou-text-disabled);
  }

  .danger {
    gap: var(--suisou-space-2);
  }
  /* ★打ち消し：stack md:row（md:row が flex-direction を戻さない） */
  @media (width >= 768px) {
    .danger {
      flex-direction: row;
      align-items: center;
    }
  }
</style>
