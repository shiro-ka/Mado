<script lang="ts">
  import { Shield, LogIn, Lock, Globe } from "lucide-svelte";
  import Button from "$lib/components/ui/button/button.svelte";
  import { Badge } from "$lib/components/ui/badge";
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

<!-- Owner header -->
<div data-suisou-layout="row" class="mb-6">
  {#if ownerProfile?.avatar}
    <img
      src={ownerProfile.avatar}
      alt={ownerProfile.handle}
      class="w-10 h-10 rounded-full object-cover shrink-0"
    />
  {:else}
    <div class="w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-bold bg-primary text-background">
      {(ownerProfile?.handle ?? cleanHandle)[0]?.toUpperCase() ?? "?"}
    </div>
  {/if}
  <div class="min-w-0">
    <p class="font-bold text-foreground">{ownerDisplayName}</p>
    <a
      href={`https://bsky.app/profile/${ownerProfile?.handle ?? cleanHandle}`}
      target="_blank"
      rel="noopener noreferrer"
      class="inline-flex items-center gap-1 text-xs hover:opacity-80 transition-opacity text-blue-400"
    >
      <Globe size={10} />
      @{ownerProfile?.handle ?? cleanHandle}
    </a>
  </div>
</div>

<!-- Box info -->
<div data-suisou-surface="panel" class="p-6 mb-5">
  <div data-suisou-layout="row stretch" class="mb-3">
    <div class="flex-1 min-w-0">
      <div data-suisou-layout="row" class="mb-1">
        <h1 class="text-lg font-bold text-foreground">{box.title}</h1>
        <Badge variant={box.isOpen ? "success" : "muted"} dot size="sm">
          {box.isOpen ? "受付中" : "受付停止"}
        </Badge>
      </div>
      {#if box.description}
        <p class="leading-relaxed text-muted-foreground">{box.description}</p>
      {/if}
    </div>
  </div>
  <div class="flex items-center gap-1.5">
    <Lock size={11} class="text-subtle" />
    <span class="text-xs text-subtle">ECIES暗号化で保護されています</span>
  </div>
</div>

<!-- Semi-anonymous disclosure -->
<div data-suisou-layout="row stretch" class="rounded-lg p-4 mb-5 bg-amber-400/7 border border-amber-400/25">
  <Shield size={15} class="shrink-0 mt-0.5 text-amber-400" />
  <p class="text-xs leading-relaxed text-muted-foreground">
    <span class="font-bold text-amber-400">半匿名のご注意：</span>{" "}
    このサービスは完全匿名ではありません。あなたのBlueskyアカウント情報は
    <strong class="text-foreground">窓のオーナーにのみ</strong>
    開示されます。第三者には公開されません。
  </p>
</div>

{#if !ownerRegistered}
  <!-- Owner not registered -->
  <div data-suisou-surface="panel" class="p-6 text-center">
    <p class="font-bold mb-1 text-foreground">このユーザーはMadoに登録されていません</p>
    <p class="text-xs text-muted-foreground">声を送るには、オーナーがMadoにログインしている必要があります。</p>
  </div>
{:else if !box.isOpen}
  <!-- Box closed -->
  <div data-suisou-surface="panel" class="p-6 text-center">
    <p class="font-bold mb-1 text-foreground">現在この窓は受付停止中です</p>
    <p class="text-xs text-muted-foreground">オーナーが受付を再開するまでお待ちください。</p>
  </div>
{:else if !session}
  <!-- Not logged in -->
  <div data-suisou-surface="panel" class="p-6 text-center flex flex-col items-center gap-4">
    <div class="w-12 h-12 rounded-lg flex items-center justify-center bg-accent-light">
      <LogIn size={20} class="text-blue-400" />
    </div>
    <div>
      <p class="font-bold mb-1 text-foreground">声を送るにはログインが必要です</p>
      <p class="text-xs leading-relaxed text-muted-foreground">
        Blueskyアカウントでログインして声を送りましょう。
        送り主はオーナーのみに開示されます。
      </p>
    </div>
    <a href={`/auth/login?next=/@${cleanHandle}/${box.slug}`} class="w-full">
      <Button size="lg" class="w-full">ログインして声を送る</Button>
    </a>
  </div>
{:else}
  <!-- Logged in -->
  <div data-suisou-surface="panel" class="p-6">
    <SendQuestionForm
      boxOwnerDid={box.ownerDid}
      boxRkey={box.rkey}
      senderHandle={session.handle}
    />
  </div>
{/if}
