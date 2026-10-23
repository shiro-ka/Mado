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

<div class="frame">
  <aside data-suisou-layout="stack" data-suisou="bd-end" class="side">
    <Sidebar {session} {officialHandle} />
  </aside>

  <div data-suisou-layout="row" data-suisou="bd-bottom" class="topbar">
    <button data-suisou-button="icon" popovertarget="nav-drawer" aria-label="メニューを開く">
      <Menu size={20} />
    </button>
    <a href="/receive"><Brand size="sm" /></a>
  </div>

  <div
    bind:this={drawer}
    id="nav-drawer"
    popover
    data-suisou-tray="drawer left"
    data-suisou-layout="stack"
    aria-label="ナビゲーション"
    style="--suisou-size-drawer: 18rem"
  >
    <Sidebar {session} {officialHandle} />
  </div>

  <main bind:this={mainEl} data-suisou="scroll-y" class="body">
    {#if children}
      {@render children()}
    {/if}
  </main>
</div>

<style>
  .frame {
    display: grid;
    grid-template-areas: "side head" "side body";
    grid-template-columns: auto minmax(0, 1fr);
    grid-template-rows: auto minmax(0, 1fr);
    height: 100dvh;
    overflow: hidden;
  }
  .body {
    grid-area: body;
  }

  .side {
    grid-area: side;
    overflow-y: auto;
    width: 16rem;
    background: var(--suisou-color-panel);
  }
  .topbar {
    grid-area: head;
    padding-inline: var(--suisou-space-3);
    height: 3.5rem;
    background: var(--suisou-color-panel);
  }

  @media (max-width: 767px) {
    .side {
      display: none;
    }
  }
  @media (min-width: 768px) {
    .topbar {
      display: none;
    }
  }

  #nav-drawer {
    padding: 0;
    overflow-y: auto;
  }
</style>
