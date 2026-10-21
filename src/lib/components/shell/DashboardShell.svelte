<script lang="ts">
  import type { Snippet } from "svelte";
  import { afterNavigate } from "$app/navigation";
  import { Menu, AlertTriangle } from "lucide-svelte";
  import Sidebar from "./Sidebar.svelte";
  import Brand from "./Brand.svelte";
  import type { AppSession } from "$lib/store.js";

  interface Props {
    session: AppSession;
    sessionExpiresAt?: number | null;
    children?: Snippet;
  }

  let { session, sessionExpiresAt = null, children }: Props = $props();

  const DAY = 24 * 60 * 60;
  const daysLeft = $derived(
    sessionExpiresAt === null ? null : Math.ceil((sessionExpiresAt - Date.now() / 1000) / DAY)
  );

  let drawer = $state<HTMLElement>();
  let mainEl = $state<HTMLElement>();

  afterNavigate(() => {
    mainEl?.scrollTo({ top: 0 });
    drawer?.hidePopover?.();
  });
</script>

<div class="frame">
  <aside data-suisou-layout="stack" data-suisou="bd-end" class="side">
    <Sidebar {session} />
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
    <Sidebar {session} />
  </div>

  <main bind:this={mainEl} data-suisou="scroll-y" class="body">
    {#if daysLeft !== null && daysLeft <= 7}
      <div data-suisou="container-s" class="expiry">
        <div data-suisou-item="notice" data-suisou-layout="row" data-suisou="warning" role="status">
          <AlertTriangle data-suisou-text="fs-20" data-suisou="warning" />
          <p data-suisou-layout="grow" data-suisou-text="fs-14">
            セッションがあと{daysLeft}日で期限切れになります。
          </p>
          <a data-suisou-text="link fs-12" href="/auth/login">再ログイン</a>
        </div>
      </div>
    {/if}
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
  .expiry {
    padding: var(--suisou-space-4) var(--suisou-space-3) 0;
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
