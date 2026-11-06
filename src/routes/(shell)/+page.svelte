<script lang="ts">
  import { AlertCircle } from "lucide-svelte";
  import { page } from "$app/state";
  import LandingContent from "$lib/components/mado/LandingContent.svelte";
  import { CATCHPHRASE } from "$lib/brand.js";
</script>

<svelte:head>
  <title>Mado - {CATCHPHRASE}</title>
  <meta name="description" content={CATCHPHRASE} />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="Mado" />
  <meta property="og:title" content={"Mado"} />
  <meta property="og:description" content={CATCHPHRASE} />
  <meta property="og:url" content={`${page.url.origin}/`} />
  <meta property="og:image" content={`${page.url.origin}/og/site`} />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:image" content={`${page.url.origin}/og/site`} />
</svelte:head>

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
