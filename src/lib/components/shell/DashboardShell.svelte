<script lang="ts">
  import type { Snippet } from "svelte";
  import { afterNavigate } from "$app/navigation";
  import { Menu } from "lucide-svelte";
  import Sidebar from "./Sidebar.svelte";
  import Brand from "./Brand.svelte";
  import type { AppSession } from "$lib/store.js";

  interface Props {
    session: AppSession;
    officialHandle?: string | null;
    children?: Snippet;
  }

  let { session, officialHandle = null, children }: Props = $props();

  let drawer = $state<HTMLElement>();
  let mainEl = $state<HTMLElement>();

  afterNavigate(() => {
    mainEl?.scrollTo({ top: 0 });
    drawer?.hidePopover?.();
  });
</script>

<div data-suisou-body="shell">
  <nav
    bind:this={drawer}
    id="nav-drawer"
    popover
    data-suisou-tray="drawer left s:dock"
    data-suisou-layout="stack"
    data-suisou="p-0"
    aria-label="ナビゲーション"
    style="--suisou-size-drawer: 16rem"
  >
    <Sidebar {session} {officialHandle} />
  </nav>

  <header data-suisou-layout="row" data-suisou="px-3 py-3 s:hidden">
    <button data-suisou-button="icon" popovertarget="nav-drawer" aria-label="メニューを開く">
      <Menu size={20} />
    </button>
    <a href="/receive"><Brand size="sm" /></a>
  </header>

  <main bind:this={mainEl} data-suisou="scroll-y p-0">
    {#if children}
      {@render children()}
    {/if}
  </main>
</div>
