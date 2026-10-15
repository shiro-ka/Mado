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
  <!-- 画面の骨格。区切りは罫がやるのですきまは持たない（gap-0） -->
  <div data-suisou-layout="stack gap-0" data-suisou="min-screen">
    <Header {session} />
    <main data-suisou-layout="stack grow">
      {@render children()}
    </main>
    <Footer />
  </div>
{/if}
