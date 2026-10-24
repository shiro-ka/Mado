<script lang="ts">
  import MadoIcon from "$lib/components/ui/MadoIcon.svelte";

  interface Props {
    size?: "sm" | "md" | "lg";
    beta?: boolean;
  }

  let { size = "md", beta = false }: Props = $props();

  const text = $derived({ sm: "fs-14", md: "fs-16", lg: "fs-20" }[size]);
  const logo = $derived(size === "sm" ? "fs-28" : "fs-32");
</script>

<span data-suisou-layout="row">
  <MadoIcon data-suisou-text={logo} data-suisou="accent" />
  <span data-suisou-text="{text} fw-700">Mado</span>
  {#if beta}
    <span data-suisou-item="tag" data-suisou="accent">beta</span>
  {/if}
</span>
