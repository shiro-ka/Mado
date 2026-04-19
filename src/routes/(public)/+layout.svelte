<script lang="ts">
  import type { Snippet } from "svelte";
  import Header from "$lib/components/shell/Header.svelte";
  import Footer from "$lib/components/shell/Footer.svelte";
  import type { LayoutData } from "./$types";

  interface Props {
    data: LayoutData;
    children: Snippet;
  }

  let { data, children }: Props = $props();
</script>

<div class="flex flex-col min-h-dvh">
  <Header session={data.session} />
  <main class="flex-1">
    {@render children()}
  </main>
  <Footer />
</div>
