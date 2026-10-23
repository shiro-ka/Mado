<script lang="ts">
  interface Props {
    size?: "sm" | "md" | "lg";
    beta?: boolean;
  }

  let { size = "md", beta = false }: Props = $props();

  const text = $derived({ sm: "fs-14", md: "fs-16", lg: "fs-20" }[size]);
</script>

<span data-suisou-layout="row" class="brand" class:sm={size === "sm"}>
  <img src="/mado-logo.svg" alt="Mado" class="logo" />
  <span data-suisou-text="{text} fw-700">Mado</span>
  {#if beta}
    <span data-suisou-item="tag" data-suisou="accent">beta</span>
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
