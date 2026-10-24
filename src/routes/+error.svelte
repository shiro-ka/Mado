<script lang="ts">
  import { page } from "$app/state";
  import { Home, AlertCircle } from "lucide-svelte";
  import Button from "$lib/components/ui/Button.svelte";

  const status = $derived(page.status);
  const message = $derived(page.error?.message ?? "エラーが発生しました");
  const isNotFound = $derived(status === 404);
</script>

<svelte:head>
  <title>{status} | Mado</title>
</svelte:head>

<div data-suisou-layout="stack center middle" data-suisou="min-screen py-4 px-3">
  <div data-suisou-layout="stack gap-3 center" data-suisou-text="center" data-suisou="container-s">
    <span data-suisou-item="square"><AlertCircle data-suisou-text="fs-20" data-suisou="error" /></span>
    <div data-suisou-layout="stack center">
      <p data-suisou-text="fs-32 fw-700">{status}</p>
      <p data-suisou-text="fs-14" data-suisou="note" class="doc">
        {#if isNotFound}
          お探しのページは見つかりませんでした。<br />URLが間違っているか、削除された可能性があります。
        {:else}
          {message}
        {/if}
      </p>
    </div>
    <Button href="/" variant="default">
      {#snippet leftIcon()}<Home />{/snippet}
      トップに戻る
    </Button>
  </div>
</div>
