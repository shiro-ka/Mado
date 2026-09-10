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

<div data-suisou-layout="pin screen" class="wrap">
  <div data-suisou-layout="stack gap-3 center" data-suisou-text="center" class="box">
    <span data-suisou-tile><AlertCircle data-suisou-icon="error" /></span>
    <div data-suisou-layout="stack center">
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
    max-width: 28rem;
  }
  .sub {
    color: var(--suisou-text-sub);
  }
</style>
