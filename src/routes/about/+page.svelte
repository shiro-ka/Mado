<script lang="ts">
  import type { PageData } from "./$types";
  import Header from "$lib/components/shell/Header.svelte";
  import Footer from "$lib/components/shell/Footer.svelte";
  import AboutContent from "$lib/components/mado/AboutContent.svelte";

  let { data }: { data: PageData } = $props();
</script>

<svelte:head><title>Madoについて | Mado</title></svelte:head>

<div class="flex flex-col min-h-dvh">
  <Header session={data.session} />
  <main class="flex-1"><AboutContent /></main>
  <Footer />
</div>
