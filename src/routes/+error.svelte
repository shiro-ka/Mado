<script lang="ts">
  import { page } from "$app/state";
  import { Home, AlertCircle } from "lucide-svelte";
  import Button from "$lib/components/ui/button/button.svelte";

  const status = $derived(page.status);
  const message = $derived(page.error?.message ?? "エラーが発生しました");
  const isNotFound = $derived(status === 404);
</script>

<svelte:head>
  <title>{status} | Mado</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center px-6 py-16 bg-background">
  <div class="w-full max-w-md text-center flex flex-col items-center gap-6">
    <div data-suisou-banner="error" class="w-14 h-14 flex items-center justify-center">
      <AlertCircle size={26} class="text-error" />
    </div>
    <div>
      <p class="text-4xl font-bold text-foreground">{status}</p>
      <p class="mt-3 leading-relaxed text-muted-foreground">
        {#if isNotFound}
          お探しのページは見つかりませんでした。<br />URLが間違っているか、削除された可能性があります。
        {:else}
          {message}
        {/if}
      </p>
    </div>
    <a href="/">
      <Button size="lg">
        {#snippet leftIcon()}<Home size={16} />{/snippet}
        ホームに戻る
      </Button>
    </a>
  </div>
</div>
