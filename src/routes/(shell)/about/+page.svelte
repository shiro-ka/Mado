<script lang="ts">
  import { page } from "$app/state";
  import LandingContent from "$lib/components/mado/LandingContent.svelte";
  import { CATCHPHRASE } from "$lib/brand.js";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
</script>

<svelte:head>
  <title>Madoについて | Mado</title>
  <meta name="description" content={CATCHPHRASE} />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="Mado" />
  <meta property="og:title" content={"Madoについて"} />
  <meta property="og:description" content={CATCHPHRASE} />
  <meta property="og:url" content={`${page.url.origin}/about`} />
  <meta property="og:image" content={`${page.url.origin}/og/site`} />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:image" content={`${page.url.origin}/og/site`} />
</svelte:head>

<LandingContent loggedIn={!!data.session} />
