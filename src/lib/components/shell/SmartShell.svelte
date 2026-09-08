<script lang="ts">
  import type { Snippet } from "svelte";
  import DashboardShell from "./DashboardShell.svelte";
  import Header from "./Header.svelte";
  import Footer from "./Footer.svelte";
  import type { AppSession } from "$lib/store.js";

  interface Props {
    session: AppSession | null;
    children: Snippet;
  }

  let { session, children }: Props = $props();
</script>

{#if session}
  <DashboardShell {session}>
    {@render children()}
  </DashboardShell>
{:else}
  <div data-suisou-layout="stack screen" class="shell">
    <Header {session} />
    <main data-suisou-layout="stack grow">
      {@render children()}
    </main>
    <Footer />
  </div>
{/if}

<style>
  /* ★gap: 0 は打ち消し。Suisou の layout はすきま（space-2）を焼き込む設計で、
     「すきま無し」の語を持たない。画面の骨格に使うとヘッダ／本文／フッタの間に
     8px の隙が空き、背景のグラデが縞に見える。 */
  .shell {
    gap: 0;
  }
</style>
