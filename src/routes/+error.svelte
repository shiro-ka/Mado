<script lang="ts">
  import { page } from "$app/state";
  import { Home, AlertCircle } from "lucide-svelte";
  import Button from "$lib/components/ui/button/button.svelte";
  import Glyph from "$lib/components/ui/Glyph.svelte";

  const status = $derived(page.status);
  const message = $derived(page.error?.message ?? "エラーが発生しました");
  const isNotFound = $derived(status === 404);
</script>

<svelte:head>
  <title>{status} | Mado</title>
</svelte:head>

<div data-suisou-layout="center screen" class="wrap">
  <div data-suisou-layout="stack" class="box">
    <Glyph><AlertCircle data-suisou-icon="error" /></Glyph>
    <div data-suisou-layout="stack" class="text">
      <p data-suisou-text="s32 w700">{status}</p>
      <p data-suisou-text="s14 doc" class="sub">
        {#if isNotFound}
          お探しのページは見つかりませんでした。<br />URLが間違っているか、削除された可能性があります。
        {:else}
          {message}
        {/if}
      </p>
    </div>
    <a href="/">
      <Button variant="default">
        {#snippet leftIcon()}<Home />{/snippet}
        ホームに戻る
      </Button>
    </a>
  </div>
</div>

<style>
  .wrap {
    padding: var(--suisou-space-4) var(--suisou-space-3);
  }
  .box {
    gap: var(--suisou-space-3);
    max-width: 28rem;
    text-align: center;
    align-items: center;
  }
  .text {
    gap: var(--suisou-space-2);
    align-items: center;
  }
  .sub {
    color: var(--suisou-text-sub);
  }
</style>
