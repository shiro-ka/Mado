<script lang="ts">
  import { Globe, MessageCircle } from "lucide-svelte";
  import Header from "$lib/components/shell/Header.svelte";
  import Footer from "$lib/components/shell/Footer.svelte";
  import QuestionBoxCard from "$lib/components/mado/QuestionBoxCard.svelte";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
</script>

<svelte:head>
  <title>{data.profile?.displayName ?? `@${data.profile?.handle ?? data.cleanHandle}`} の質問箱 | Mado</title>
</svelte:head>

<div class="flex flex-col min-h-dvh">
  <Header session={data.session} />
  <main class="flex-1 px-4 py-10">
    <div class="mx-auto max-w-2xl">
      <!-- Profile header -->
      <div class="rounded-2xl p-6 mb-6 flex items-start gap-4 bg-surface border border-border">
        {#if data.profile?.avatar}
          <img
            src={data.profile.avatar}
            alt={data.profile.handle}
            class="w-16 h-16 rounded-full object-cover shrink-0"
          />
        {:else}
          <div class="w-16 h-16 rounded-full flex items-center justify-center shrink-0 font-bold text-2xl bg-accent text-white">
            {(data.profile?.handle ?? data.cleanHandle)[0]?.toUpperCase() ?? "?"}
          </div>
        {/if}
        <div class="flex-1 min-w-0">
          <h1 class="text-xl font-bold text-primary">
            {data.profile?.displayName ?? `@${data.profile?.handle ?? data.cleanHandle}`}
          </h1>
          <p class="text-sm mt-0.5 text-muted">@{data.profile?.handle ?? data.cleanHandle}</p>
          {#if data.profile?.description}
            <p class="text-sm mt-2 leading-relaxed text-muted">{data.profile.description}</p>
          {/if}
          <a
            href={`https://bsky.app/profile/${data.profile?.handle ?? data.cleanHandle}`}
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-1 mt-2 text-xs hover:opacity-80 transition-opacity text-blue-400"
          >
            <Globe size={11} />
            Blueskyで見る
          </a>
        </div>
      </div>

      <!-- Box list -->
      <div class="mb-3 flex items-center gap-2">
        <MessageCircle size={16} class="text-subtle" />
        <h2 class="text-sm font-semibold text-muted">質問箱 ({data.openBoxes.length}件)</h2>
      </div>

      {#if data.openBoxes.length === 0}
        <div class="rounded-2xl p-10 text-center bg-surface border border-dashed border-border-strong">
          <p class="text-sm text-muted">現在受付中の質問箱はありません</p>
        </div>
      {:else}
        <div class="flex flex-col gap-3">
          {#each data.openBoxes as box}
            <QuestionBoxCard {box} ownerHandle={data.profile?.handle ?? data.cleanHandle} />
          {/each}
        </div>
      {/if}
    </div>
  </main>
  <Footer />
</div>
