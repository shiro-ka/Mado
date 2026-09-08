<script lang="ts">
  // Shared Mado wordmark (logo + "Mado" + optional beta badge). Presentational
  // only — callers wrap it in their own <a>/onclick so link targets stay local.
  //
  // ★寸法は Suisou の段に寄せた。旧実装は text-sm / text-base / text-lg（14/16/18）
  //   だったが、18 は Suisou のスケールに無い（12/14/16/20/24/28/32）ので s20 に上げた。
  //   ロゴの実寸だけは Suisou に語彙が無いので scoped style で持つ。
  interface Props {
    size?: "sm" | "md" | "lg";
    beta?: boolean;
  }

  let { size = "md", beta = false }: Props = $props();

  const text = $derived({ sm: "s14", md: "s16", lg: "s20" }[size]);
</script>

<span data-suisou-layout="row" class="brand" class:sm={size === "sm"}>
  <img src="/mado-logo.svg" alt="Mado" class="logo" />
  <span data-suisou-text="{text} w700">Mado</span>
  {#if beta}
    <span data-suisou-tag="accent">beta</span>
  {/if}
</span>

<style>
  .logo {
    width: 2rem;
    height: 2rem;
  }
  .brand.sm .logo {
    width: 1.75rem;
    height: 1.75rem;
  }
</style>
