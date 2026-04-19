<script lang="ts">
  import { ArrowLeft, User, ExternalLink, Lock, MessageCircle } from "lucide-svelte";
  import Button from "$lib/components/ui/Button.svelte";
  import Badge from "$lib/components/ui/Badge.svelte";
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
  <meta property="og:title" content="匿名の質問" />
  <meta property="og:description" content={data.question.body.slice(0, 200)} />
  <meta property="og:url" content={`${data.origin}/@${data.cleanHandle}/${data.box.slug}/${data.question.rkey}`} />
  <meta property="og:image" content={`${data.origin}/og/@${data.cleanHandle}/${data.box.slug}/${data.question.rkey}`} />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:image" content={`${data.origin}/og/@${data.cleanHandle}/${data.box.slug}/${data.question.rkey}`} />
</svelte:head>

<div class="px-6 py-8 max-w-2xl mx-auto">
  <!-- Back -->
  <div class="mb-8">
    <a href={data.isOwner ? "/receive" : `/@${data.cleanHandle}/${data.box.slug}`}>
      <Button variant="ghost" size="sm">
        {#snippet leftIcon()}<ArrowLeft size={15} />{/snippet}
        {data.isOwner ? "受信トレイに戻る" : "窓に戻る"}
      </Button>
    </a>
  </div>

  <!-- Question card -->
  <div class="rounded-2xl p-6 mb-5 bg-surface border border-border">
    <div class="flex items-center justify-between mb-4">
      <Badge variant={data.question.isRead ? "muted" : "default"} dot>
        {data.question.isRead ? "既読" : "未読"}
      </Badge>
      <span class="text-xs text-subtle">{formatDateFull(data.question.createdAt)}</span>
    </div>

    <div class="mb-5">
      <p class="text-base leading-relaxed whitespace-pre-wrap text-primary">{data.question.body}</p>
    </div>

    {#if data.isOwner}
      <!-- Decrypt error -->
      {#if data.decryptError}
        <div class="mb-4 rounded-lg p-3 flex items-center gap-2 bg-red-400/8 border border-red-400/20">
          <Lock size={14} class="text-error" />
          <p class="text-sm text-error">送信者の特定に失敗しました。秘密鍵が見つかりません。</p>
        </div>
      {/if}

      <!-- Sender info -->
      <div class="pt-4 flex items-center gap-3 border-t border-border">
        {#if data.senderProfile?.avatar}
          <img
            src={data.senderProfile.avatar}
            alt={data.senderProfile.handle}
            class="w-9 h-9 rounded-full object-cover shrink-0"
          />
        {:else}
          <div class="w-9 h-9 rounded-full flex items-center justify-center shrink-0 bg-elevated">
            <User size={16} class="text-subtle" />
          </div>
        {/if}
        <div class="flex-1 min-w-0">
          {#if data.senderProfile}
            <p class="text-sm font-medium text-primary">
              {data.senderProfile.displayName ?? data.senderProfile.handle}
            </p>
            <p class="text-xs text-muted">@{data.senderProfile.handle}</p>
          {:else if data.senderDid}
            <p class="text-xs font-mono text-subtle">{data.senderDid}</p>
          {:else}
            <p class="text-sm text-subtle">送信者情報なし</p>
          {/if}
        </div>
        {#if data.senderProfile}
          <a
            href={`https://bsky.app/profile/${data.senderProfile.handle}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="ghost" size="sm"><ExternalLink size={13} /></Button>
          </a>
        {/if}
      </div>
    {/if}
  </div>

  <!-- Existing answers -->
  {#if data.answers.length > 0}
    <div class="mb-5 flex flex-col gap-3">
      <h2 class="text-sm font-semibold text-primary">回答済み（{data.answers.length}件）</h2>
      {#each data.answers as answer}
        <div class="rounded-2xl p-5 bg-surface border border-border">
          <div class="flex items-center gap-2 mb-3">
            <div class="w-6 h-6 rounded-full flex items-center justify-center shrink-0 bg-accent-light">
              <MessageCircle size={12} class="text-accent" />
            </div>
            <span class="text-xs font-medium text-muted">回答</span>
            <span class="text-xs ml-auto text-subtle">{formatDateFull(answer.createdAt)}</span>
          </div>
          <p class="text-sm leading-relaxed whitespace-pre-wrap text-primary">{answer.body}</p>
        </div>
      {/each}
    </div>
  {/if}

  <!-- Owner-only: answer form + danger zone -->
  {#if data.isOwner}
    <div class="rounded-2xl p-6 mb-5 bg-surface border border-border">
      <h2 class="text-sm font-semibold mb-4 text-primary">回答を書く</h2>
      <AnswerForm
        koeUri={data.koeUri}
        questionBody={data.question.body}
        pageUrl={`${data.origin}/@${data.cleanHandle}/${data.box.slug}/${data.question.rkey}`}
      />
    </div>

    <div class="rounded-2xl p-5 flex flex-col sm:flex-row gap-3 bg-red-400/5 border border-red-400/15">
      <DeleteQuestionButton rkey={data.question.rkey} />
      {#if data.senderDid}
        <BlockButton senderDid={data.senderDid} />
      {/if}
    </div>
  {/if}
</div>
