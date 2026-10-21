<script lang="ts">
  import { Menu } from "lucide-svelte";
  import Button from "$lib/components/ui/Button.svelte";
  import Brand from "./Brand.svelte";
  import type { AppSession } from "$lib/store.js";

  interface Props {
    session?: AppSession | null;
  }

  let { session = null }: Props = $props();

  const navLinks = [
    { href: "/about", label: "Madoについて" },
    { href: "/guide", label: "使い方" },
    { href: "/semi-anon", label: "半匿名の仕組み" },
  ];
</script>

<header data-suisou="bd-bottom" class="bar">
  <div data-suisou-layout="row between" class="inner">
    <a href="/" class="group">
      <Brand size="lg" beta />
    </a>

    <nav data-suisou-layout="row" class="links">
      {#each navLinks as link}
        <Button href={link.href} variant="ghost">{link.label}</Button>
      {/each}
    </nav>

    <div data-suisou-layout="row">
      {#if session}
        <Button href="/receive" variant="default">受信トレイ</Button>
      {:else}
        <Button href="/auth/login" variant="default">ログイン</Button>
      {/if}
      <button
        data-suisou-button="icon"
        class="burger"
        popovertarget="site-nav"
        aria-label="メニュー"
      >
        <Menu size={20} />
      </button>
    </div>
  </div>

  <nav id="site-nav" popover data-suisou-tray data-suisou-layout="stack" class="sheet">
    {#each navLinks as link}
      <a href={link.href} data-suisou-button="block">{link.label}</a>
    {/each}
  </nav>
</header>

<style>
  .bar {
    position: sticky;
    top: 0;
    z-index: 40;
    width: 100%;
    background: var(--suisou-color-panel);
  }
  .inner {
    margin-inline: auto;
    max-width: 72rem;
    padding-inline: var(--suisou-space-3);
    height: 4rem;
  }
  @media (max-width: 767px) {
    .links {
      display: none;
    }
  }
  @media (min-width: 768px) {
    .burger {
      display: none;
    }
  }
  .sheet {
    position: fixed;
    inset: 4rem 0 auto 0;
    width: 100%;
    max-width: none;
    margin: 0;
    border-inline: 0;
    border-block-start: 0;
    border-radius: 0;
  }
</style>
