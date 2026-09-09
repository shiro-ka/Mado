<script lang="ts">
  import type { Snippet } from "svelte";
  import { afterNavigate } from "$app/navigation";
  import { Menu } from "lucide-svelte";
  import Sidebar from "./Sidebar.svelte";
  import Brand from "./Brand.svelte";
  import type { AppSession } from "$lib/store.js";

  interface Props {
    session: AppSession;
    children?: Snippet;
  }

  let { session, children }: Props = $props();

  let drawer = $state<HTMLElement>();
  let mainEl = $state<HTMLElement>();

  // The shell is a fixed-height app frame: `main` scrolls internally rather than
  // the document. SvelteKit's scroll handling targets the window, so reset the
  // real scroll container to the top on navigation.
  afterNavigate(() => {
    mainEl?.scrollTo({ top: 0 });
    drawer?.hidePopover?.();
  });
</script>

<!-- 画面の骨格。区画の名前は Suisou が持つ（aside / body）。
     :has() で aside の有無を見て列を畳むので、狭い画面では
     aside を消すだけで1列になる ―― ここで grid を書き直す必要がない。 -->
<div data-suisou-layout="frame gap-0" class="frame">
  <!-- Desktop sidebar -->
  <aside data-suisou-layout="aside stack scroll" data-suisou-rule="end" class="side">
    <Sidebar {session} />
  </aside>

  <!-- Mobile topbar -->
  <div data-suisou-layout="head row" data-suisou-rule="bottom" class="topbar">
    <!-- ★popovertarget だけで開く。JS は1行も要らない（Suisou 掟4）。
         ESC・外側クリック・フォーカスの閉じ込め・重なり順・膜は全部ブラウザの仕事。
         自前で持つと焦点トラップ／Escape／スクロール錠／フォーカス復帰で 50 行を超える。 -->
    <button data-suisou-button="icon" popovertarget="nav-drawer" aria-label="メニューを開く">
      <Menu size={20} />
    </button>
    <a href="/home"><Brand size="sm" /></a>
  </div>

  <!-- Mobile drawer。左から出る（drawer start は Mado の要求で Suisou に足した） -->
  <div
    bind:this={drawer}
    id="nav-drawer"
    popover
    data-suisou-surface="overlay drawer start"
    data-suisou-layout="stack scroll"
    aria-label="ナビゲーション"
    style="--suisou-drawer: 18rem"
  >
    <Sidebar {session} />
  </div>

  <!-- Main content -->
  <main bind:this={mainEl} data-suisou-layout="body scroll">
    {#if children}
      {@render children()}
    {/if}
  </main>
</div>

<style>
  /* 骨格の実寸だけが現場のもの。面と罫は Suisou のトークン。

     ★すきまは gap-0。アプリの骨格は区画どうしを**罫で**区切るので隙間が要らない。
       ★★しかも狭い画面で aside を display:none にしても frame の :has() は
         当たったままなので、0 にしないと畳んだ側に 8px の帯が残る
         （Suisou への申し送り）。 */
  .frame {
    height: 100dvh;
    overflow: hidden;
  }

  .side {
    width: 16rem;
    background: var(--suisou-panel);
  }
  .topbar {
    padding-inline: var(--suisou-space-3);
    height: 3.5rem;
    background: var(--suisou-panel);
  }

  /* 狭い画面ではサイドバーを畳み、上のバーを出す。
     frame の :has(aside) が効かなくなるので、grid は自動で1列になる。 */
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

  /* ドロワーは中身（Sidebar）が自分で余白を持つので、器は端まで */
  #nav-drawer {
    padding: 0;
  }
</style>
