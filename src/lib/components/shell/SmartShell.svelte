<script lang="ts">
  import type { Snippet } from "svelte";
  import DashboardShell from "./DashboardShell.svelte";
  import Header from "./Header.svelte";
  import Footer from "./Footer.svelte";
  import type { AppSession } from "$lib/store.js";

  interface Props {
    session: AppSession | null;
    sessionExpiresAt?: number | null;
    children: Snippet;
  }

  let { session, sessionExpiresAt = null, children }: Props = $props();
</script>

{#if session}
  <DashboardShell {session} {sessionExpiresAt}>
    {@render children()}
  </DashboardShell>
{:else}
  <div data-suisou-layout="stack gap-0" data-suisou="min-screen">
    <Header {session} />
    <main data-suisou-layout="stack" class="main">
      {@render children()}
    </main>
    <Footer />
  </div>
{/if}

<style>
  .main {
    flex: 1 0 auto;
  }
</style>
