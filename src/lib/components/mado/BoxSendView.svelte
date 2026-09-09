<script lang="ts">
  import { Shield, LogIn, Lock, Globe } from "lucide-svelte";
  import Button from "$lib/components/ui/button/button.svelte";
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
  <div data-suisou-media>
    {#if ownerProfile?.avatar}
      <img
        data-suisou-avatar="large"
        data-suisou-media-icon
        src={ownerProfile.avatar}
        alt={ownerProfile.handle}
      />
    {:else}
      <div data-suisou-avatar="large" data-suisou-media-icon>
        {(ownerProfile?.handle ?? cleanHandle)[0]?.toUpperCase() ?? "?"}
      </div>
    {/if}
    <div data-suisou-media-content>
      <p data-suisou-text="s14 w700">{ownerDisplayName}</p>
      <a
        data-suisou-layout="row"
        data-suisou-text="s12"
        data-suisou-link
        class="accent"
        href={`https://bsky.app/profile/${ownerProfile?.handle ?? cleanHandle}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        <Globe data-suisou-icon="small" />
        @{ownerProfile?.handle ?? cleanHandle}
      </a>
    </div>
  </div>

  <!-- 窓の情報 -->
  <div data-suisou-surface="panel" data-suisou-layout="stack" class="box">
    <div data-suisou-layout="row wrap">
      <h1 data-suisou-text="s20 w700">{box.title}</h1>
      <span data-suisou-tag={box.isOpen ? "success" : ""}>
        {box.isOpen ? "受付中" : "受付停止"}
      </span>
    </div>
    {#if box.description}
      <p data-suisou-text="s14 doc" class="sub">{box.description}</p>
    {/if}
    <div data-suisou-layout="row" data-suisou-text="s12" class="sub">
      <Lock data-suisou-icon="small" />
      ECIES暗号化で保護されています
    </div>
  </div>

  <div data-suisou-banner="warning" data-suisou-media>
    <Shield data-suisou-icon="small warning" data-suisou-media-icon />
    <p data-suisou-media-content data-suisou-text="s12 doc">
      <strong class="warn">半匿名のご注意：</strong>
      このサービスは完全匿名ではありません。あなたのBlueskyアカウント情報は
      <strong>窓のオーナーにのみ</strong>
      開示されます。第三者には公開されません。
    </p>
  </div>

  {#if !ownerRegistered}
    <div data-suisou-surface="panel" data-suisou-layout="stack" data-suisou-text="center" class="notice">
      <p data-suisou-text="s14 w700">このユーザーはMadoに登録されていません</p>
      <p data-suisou-text="s12" class="sub">声を送るには、オーナーがMadoにログインしている必要があります。</p>
    </div>
  {:else if !box.isOpen}
    <div data-suisou-surface="panel" data-suisou-layout="stack" data-suisou-text="center" class="notice">
      <p data-suisou-text="s14 w700">現在この窓は受付停止中です</p>
      <p data-suisou-text="s12" class="sub">オーナーが受付を再開するまでお待ちください。</p>
    </div>
  {:else if !session}
    <div data-suisou-surface="panel" data-suisou-layout="stack" data-suisou-text="center" class="notice">
      <span data-suisou-tile><LogIn data-suisou-icon="accent" /></span>
      <div data-suisou-layout="stack gap-1" class="center">
        <p data-suisou-text="s14 w700">声を送るにはログインが必要です</p>
        <p data-suisou-text="s12 doc" class="sub">
          Blueskyアカウントでログインして声を送りましょう。
          送り主はオーナーのみに開示されます。
        </p>
      </div>
      <a class="full" href={`/auth/login?next=/@${cleanHandle}/${box.slug}`}>
        <Button variant="default" wide>ログインして声を送る</Button>
      </a>
    </div>
  {:else}
    <div data-suisou-surface="panel">
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
    align-items: center;
    padding: var(--suisou-space-4);
  }
  .center {
    align-items: center;
  }
  .full {
    width: 100%;
  }
  .sub {
    color: var(--suisou-text-sub);
  }
  .accent {
    color: var(--suisou-accent);
  }
  .warn {
    color: var(--suisou-warning);
  }
</style>
