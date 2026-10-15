<script lang="ts">
  import { Shield, LogIn, Lock, Globe } from "lucide-svelte";
  import Button from "$lib/components/ui/Button.svelte";
  import SendQuestionForm from "$lib/components/mado/SendQuestionForm.svelte";
  import type { QuestionBox } from "$lib/../types/index.js";

  // Structural subset of atproto's ProfileViewDetailed — only the fields shown.
  interface OwnerProfile {
    handle?: string;
    displayName?: string;
    avatar?: string;
  }

  interface Props {
    box: QuestionBox;
    ownerProfile: OwnerProfile | null;
    cleanHandle: string;
    ownerRegistered: boolean;
    session: { handle: string } | null;
  }

  let { box, ownerProfile, cleanHandle, ownerRegistered, session }: Props = $props();

  const ownerDisplayName = $derived(
    ownerProfile?.displayName ?? `@${ownerProfile?.handle ?? cleanHandle}`
  );
</script>

<div data-suisou-layout="stack gap-3" class="view">
  <!-- オーナー。アバターは Suisou の avatar（円＝人・主体）。 -->
  <div data-suisou-item="media">
    {#if ownerProfile?.avatar}
      <img
        data-suisou-item="circle large media-figure"
        src={ownerProfile.avatar}
        alt={ownerProfile.handle}
      />
    {:else}
      <div data-suisou-item="circle large media-figure">
        {(ownerProfile?.handle ?? cleanHandle)[0]?.toUpperCase() ?? "?"}
      </div>
    {/if}
    <div data-suisou-item="media-content">
      <p data-suisou-text="fs-14 fw-700">{ownerDisplayName}</p>
      <a
        data-suisou-layout="row"
        data-suisou-text="fs-12 link"
        class="accent"
        href={`https://bsky.app/profile/${ownerProfile?.handle ?? cleanHandle}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        <Globe data-suisou-text="fs-16" />
        @{ownerProfile?.handle ?? cleanHandle}
      </a>
    </div>
  </div>

  <!-- 窓の情報 -->
  <div data-suisou-tray data-suisou-layout="stack" class="box">
    <div data-suisou-layout="row wrap">
      <h1 data-suisou-text="fs-20 fw-700">{box.title}</h1>
      <span data-suisou-item="tag" data-suisou={box.isOpen ? "success" : undefined}>
        {box.isOpen ? "受付中" : "受付停止"}
      </span>
    </div>
    {#if box.description}
      <p data-suisou-text="fs-14 doc" class="sub">{box.description}</p>
    {/if}
    <div data-suisou-layout="row" data-suisou-text="fs-12" class="sub">
      <Lock data-suisou-text="fs-16" />
      ECIES暗号化で保護されています
    </div>
  </div>

  <div data-suisou-item="notice media" data-suisou="warning">
    <Shield data-suisou-item="media-figure" data-suisou-text="fs-16" data-suisou="warning" />
    <p data-suisou-item="media-content" data-suisou-text="fs-12 doc">
      <strong class="warn">半匿名のご注意：</strong>
      このサービスは完全匿名ではありません。あなたのBlueskyアカウント情報は
      <strong>窓のオーナーにのみ</strong>
      開示されます。第三者には公開されません。
    </p>
  </div>

  {#if !ownerRegistered}
    <div data-suisou-tray data-suisou-layout="stack center" data-suisou-text="center" class="notice">
      <p data-suisou-text="fs-14 fw-700">このユーザーはMadoに登録されていません</p>
      <p data-suisou-text="fs-12" class="sub">声を送るには、オーナーがMadoにログインしている必要があります。</p>
    </div>
  {:else if !box.isOpen}
    <div data-suisou-tray data-suisou-layout="stack center" data-suisou-text="center" class="notice">
      <p data-suisou-text="fs-14 fw-700">現在この窓は受付停止中です</p>
      <p data-suisou-text="fs-12" class="sub">オーナーが受付を再開するまでお待ちください。</p>
    </div>
  {:else if !session}
    <div data-suisou-tray data-suisou-layout="stack center" data-suisou-text="center" class="notice">
      <span data-suisou-item="square"><LogIn data-suisou-text="fs-20" data-suisou="accent" /></span>
      <div data-suisou-layout="stack gap-1 center">
        <p data-suisou-text="fs-14 fw-700">声を送るにはログインが必要です</p>
        <p data-suisou-text="fs-12 doc" class="sub">
          Blueskyアカウントでログインして声を送りましょう。
          送り主はオーナーのみに開示されます。
        </p>
      </div>
      <a class="full" href={`/auth/login?next=/@${cleanHandle}/${box.slug}`}>
        <Button variant="default" wide>ログインして声を送る</Button>
      </a>
    </div>
  {:else}
    <div data-suisou-tray>
      <SendQuestionForm
        boxOwnerDid={box.ownerDid}
        boxRkey={box.rkey}
        senderHandle={session.handle}
      />
    </div>
  {/if}
</div>

<style>
  .notice {
    padding: var(--suisou-space-4);
  }
  .full {
    width: 100%;
  }
  .sub {
    color: var(--suisou-color-text-sub);
  }
  .accent {
    color: var(--suisou-color-accent);
  }
  .warn {
    color: var(--suisou-color-warning);
  }
</style>
