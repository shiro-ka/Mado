<script lang="ts">
  import { Menu, X } from "lucide-svelte";
  import Button from "$lib/components/ui/button/button.svelte";
  import Brand from "./Brand.svelte";
  import type { AppSession } from "$lib/store.js";

  interface Props {
    session?: AppSession | null;
  }

  let { session = null }: Props = $props();

  let menuOpen = $state(false);

  const navLinks = [
    { href: "/about", label: "Madoについて" },
    { href: "/guide", label: "使い方" },
    { href: "/semi-anon", label: "半匿名の仕組み" },
  ];
</script>

<header class="sticky top-0 z-40 w-full bg-surface border-b border-border">
  <div class="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between gap-4">
    <!-- Logo -->
    <a href="/" class="group">
      <Brand size="lg" beta />
    </a>

    <!-- Nav links (desktop) -->
    <nav class="hidden md:flex items-center gap-1">
      {#each navLinks as link}
        <a href={link.href}>
          <Button variant="ghost" size="sm">{link.label}</Button>
        </a>
      {/each}
    </nav>

    <!-- Auth CTA + mobile menu toggle -->
    <div class="flex items-center gap-2">
      {#if session}
        <a href="/home">
          <Button variant="default" size="sm">ホーム</Button>
        </a>
      {:else}
        <a href="/auth/login">
          <Button variant="default" size="sm">ログイン</Button>
        </a>
      {/if}
      <button
        onclick={() => (menuOpen = !menuOpen)}
        class="md:hidden p-2 rounded-lg text-muted-foreground cursor-pointer"
        aria-label={menuOpen ? "メニューを閉じる" : "メニューを開く"}
        aria-expanded={menuOpen}
      >
        {#if menuOpen}<X size={20} />{:else}<Menu size={20} />{/if}
      </button>
    </div>
  </div>

  <!-- Mobile nav panel -->
  {#if menuOpen}
    <nav class="md:hidden border-t border-border px-4 py-2 flex flex-col">
      {#each navLinks as link}
        <a
          href={link.href}
          onclick={() => (menuOpen = false)}
          class="px-3 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:bg-elevated hover:text-foreground transition-colors"
        >
          {link.label}
        </a>
      {/each}
    </nav>
  {/if}
</header>
