<script lang="ts">
  import { AlertCircle } from "lucide-svelte";
  import { page } from "$app/state";
  import LandingContent from "$lib/components/mado/LandingContent.svelte";
</script>

<svelte:head>
  <title>Mado - 半匿名メッセージ</title>
  <meta name="description" content="ATProtocol基盤の半匿名メッセージサービス。Blueskyアカウントで声を送ろう。" />
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
