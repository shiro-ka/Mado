<script lang="ts">
  import type { Snippet } from "svelte";
  import DashboardShell from "$lib/components/shell/DashboardShell.svelte";
  import type { LayoutData } from "./$types";

  interface Props {
    data: LayoutData;
    children?: Snippet;
  }

  let { data, children }: Props = $props();
</script>

<DashboardShell session={data.session}>
  {#if children}
    {@render children()}
  {/if}
</DashboardShell>
