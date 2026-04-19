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
  <div class="flex flex-col min-h-dvh">
    <Header {session} />
    <main class="flex-1">
      {@render children()}
    </main>
    <Footer />
  </div>
{/if}
