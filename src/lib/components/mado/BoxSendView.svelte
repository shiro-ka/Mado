<script lang="ts">
  import { LogIn, Globe } from "lucide-svelte";
  import Button from "$lib/components/ui/Button.svelte";
  import SendQuestionForm from "$lib/components/mado/SendQuestionForm.svelte";
  import type { QuestionBox } from "$lib/../types/index.js";

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
    embedded?: boolean;
  }

  let { box, ownerProfile, cleanHandle, ownerRegistered, session, embedded = false }: Props = $props();

  const ownerDisplayName = $derived(
    ownerProfile?.displayName ?? `@${ownerProfile?.handle ?? cleanHandle}`
  );
</script>

<div data-suisou-layout="stack gap-3" class="view">
  {#if embedded}
    <h2 data-suisou-text="fs-20 fw-700">声を送る</h2>
  {:else}
    <h1 data-suisou-text="fs-24 fw-700">声を送る</h1>
  {/if}

  <div data-suisou-tray data-suisou-layout="stack gap-0" class="panel">
    {#if !embedded}
      <div data-suisou-item="media" data-suisou="bd-bottom" class="owner">
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
    {/if}

    <div data-suisou-layout="stack" class="summary">
      <div data-suisou-layout="row wrap">
        <p data-suisou-text="fs-20 fw-700" class="title">{box.title}</p>
        <span data-suisou-item="tag" data-suisou={box.isOpen ? "success" : undefined}>
          {box.isOpen ? "受付中" : "受付停止"}
        </span>
      </div>
      {#if box.description}
        <p data-suisou-text="fs-14" class="sub doc">{box.description}</p>
      {/if}
    </div>
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
        <p data-suisou-text="fs-12" class="sub doc">
          Blueskyアカウントでログインして声を送りましょう。
          送り主はオーナーのみに開示されます。
        </p>
      </div>
      <Button href={`/auth/login?next=/@${cleanHandle}/${box.slug}`} variant="default" wide>ログインして声を送る</Button>
    </div>
  {:else}
    <div data-suisou-tray class="notice">
      <SendQuestionForm
        boxOwnerDid={box.ownerDid}
        boxRkey={box.rkey}
        senderHandle={session.handle}
      />
    </div>
  {/if}
</div>

<style>
  .panel {
    padding: 0;
  }
  .owner {
    align-items: center;
    padding: var(--suisou-space-3) var(--suisou-space-4);
  }
  .summary {
    padding: var(--suisou-space-3) var(--suisou-space-4) var(--suisou-space-4);
  }
  .title {
    flex: 0 1 auto;
    min-width: 0;
    overflow-wrap: anywhere;
  }
  .notice {
    padding: var(--suisou-space-4);
  }
  .sub {
    color: var(--suisou-color-text-note);
  }
  .accent {
    color: var(--suisou-color-accent);
  }
</style>
