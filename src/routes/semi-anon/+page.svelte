<script lang="ts">
  import type { PageData } from "./$types";
  import Header from "$lib/components/shell/Header.svelte";
  import Footer from "$lib/components/shell/Footer.svelte";
  import SemiAnonContent from "$lib/components/mado/SemiAnonContent.svelte";

  let { data }: { data: PageData } = $props();
</script>

<svelte:head><title>半匿名の仕組み | Mado</title></svelte:head>

<div class="flex flex-col min-h-dvh">
  <Header session={data.session} />
  <main class="flex-1"><SemiAnonContent /></main>
  <Footer />
</div>
