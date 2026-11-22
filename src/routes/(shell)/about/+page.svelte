<script lang="ts">
  import OgMeta from "$lib/components/shell/OgMeta.svelte";
  import { page } from "$app/state";
  import LandingContent from "$lib/components/mado/LandingContent.svelte";
  import { CATCHPHRASE } from "$lib/brand.js";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
</script>

<svelte:head>
  <title>Madoについて | Mado</title>
  <meta name="description" content={CATCHPHRASE} />
</svelte:head>

<OgMeta title="Madoについて" description={CATCHPHRASE} url={`${page.url.origin}/about`} image={`${page.url.origin}/og/site`} />

<LandingContent loggedIn={!!data.session} />
