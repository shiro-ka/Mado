<script lang="ts">
  import OgMeta from "$lib/components/shell/OgMeta.svelte";
  import { AlertCircle } from "lucide-svelte";
  import { page } from "$app/state";
  import LandingContent from "$lib/components/mado/LandingContent.svelte";
  import { CATCHPHRASE } from "$lib/brand.js";
</script>

<svelte:head>
  <title>Mado - {CATCHPHRASE}</title>
  <meta name="description" content={CATCHPHRASE} />
</svelte:head>

<OgMeta title="Mado" description={CATCHPHRASE} url={`${page.url.origin}/`} image={`${page.url.origin}/og/site`} />

{#if page.url.searchParams.has("login_error")}
  <div data-suisou="container" class="error">
    <p data-suisou-item="notice" data-suisou-layout="row" data-suisou="error" role="alert">
      <AlertCircle data-suisou-text="fs-16" />
      ログインできませんでした。もう一度お試しください。
    </p>
  </div>
{/if}

<LandingContent />

<style>
  .error {
    padding: var(--suisou-space-4) var(--suisou-space-3) 0;
  }
</style>
