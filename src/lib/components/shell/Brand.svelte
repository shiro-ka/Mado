<script lang="ts">
  // Shared Mado wordmark (logo + "Mado" + optional beta badge). Presentational
  // only — callers wrap it in their own <a>/onclick so link targets stay local.
  interface Props {
    size?: "sm" | "md" | "lg";
    beta?: boolean;
  }

  let { size = "md", beta = false }: Props = $props();

  const dims = $derived(
    {
      sm: { logo: "w-7 h-7", text: "text-sm" },
      md: { logo: "w-8 h-8", text: "text-base" },
      lg: { logo: "w-8 h-8", text: "text-lg" },
    }[size]
  );
</script>

<span data-suisou-layout="row">
  <img src="/mado-logo.svg" alt="Mado" class={dims.logo} />
  <span data-suisou-text="w700" class={dims.text}>Mado</span>
  {#if beta}
    <span data-suisou-tag="accent">beta</span>
  {/if}
</span>
