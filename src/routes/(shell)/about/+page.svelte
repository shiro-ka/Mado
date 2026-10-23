<script lang="ts">
  import LandingContent from "$lib/components/mado/LandingContent.svelte";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
</script>

<svelte:head><title>Madoについて | Mado</title></svelte:head>

<LandingContent loggedIn={!!data.session} />
