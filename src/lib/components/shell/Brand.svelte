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

<span class="flex items-center gap-2">
  <img src="/mado-logo.svg" alt="Mado" class={dims.logo} />
  <span class="font-bold {dims.text} text-foreground">Mado</span>
  {#if beta}
    <span
      class="text-xs px-1.5 py-0.5 rounded-full font-medium bg-accent-light text-primary border border-border"
    >
      beta
    </span>
  {/if}
</span>
