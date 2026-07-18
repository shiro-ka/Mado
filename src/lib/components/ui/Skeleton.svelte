<script lang="ts">
  import { cn } from "$lib/utils.js";

  let { class: className = "" }: { class?: string } = $props();
</script>

<div class={cn("animate-pulse rounded-md bg-surface", className)}></div>
