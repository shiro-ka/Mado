<script lang="ts">
  import type { Snippet } from "svelte";
  import DashboardShell from "./DashboardShell.svelte";
  import Header from "./Header.svelte";
  import Footer from "./Footer.svelte";
  import type { AppSession } from "$lib/store.js";

  interface Props {
    session: AppSession | null;
    officialHandle?: string | null;
    children: Snippet;
  }

  let { session, officialHandle = null, children }: Props = $props();
</script>

{#if session}
  <DashboardShell {session}>
    {@render children()}
  </DashboardShell>
{:else}
  <div data-suisou-layout="stack gap-0" data-suisou="min-screen">
    <Header {session} />
    <main data-suisou-layout="stack" class="main">
      {@render children()}
    </main>
    <Footer {officialHandle} />
  </div>
{/if}

<style>
  .main {
    flex: 1 0 auto;
  }
</style>
