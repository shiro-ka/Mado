<script lang="ts">
  import Button from "$lib/components/ui/Button.svelte";
  import type { AppSession } from "$lib/store.js";

  interface Props {
    session?: AppSession | null;
  }

  let { session = null }: Props = $props();
</script>

<header class="sticky top-0 z-40 w-full h-16 bg-gray-950 border-b border-gray-800">
  <div class="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between gap-4">
    <!-- Logo -->
    <a href="/" class="flex items-center gap-2 group">
      <img src="/mado-logo.svg" alt="Mado" class="w-8 h-8" />
      <span class="font-bold text-lg text-primary">Mado</span>
      <span class="text-xs px-1.5 py-0.5 rounded-full font-medium bg-accent-light text-blue-400 border border-blue-600/30">
        beta
      </span>
    </a>

    <!-- Nav links -->
    <nav class="hidden md:flex items-center gap-1">
      <a href="/about">
        <Button variant="ghost" size="sm">Madoについて</Button>
      </a>
      <a href="/guide">
        <Button variant="ghost" size="sm">使い方</Button>
      </a>
      <a href="/semi-anon">
        <Button variant="ghost" size="sm">半匿名の仕組み</Button>
      </a>
    </nav>

    <!-- Auth CTA -->
    <div class="flex items-center gap-2">
      {#if session}
        <a href="/dashboard">
          <Button variant="default" size="sm">ダッシュボード</Button>
        </a>
      {:else}
        <a href="/auth/login">
          <Button variant="default" size="sm">ログイン</Button>
        </a>
      {/if}
    </div>
  </div>
</header>
