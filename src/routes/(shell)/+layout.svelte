<script lang="ts">
  import type { Snippet } from "svelte";
  import SmartShell from "$lib/components/shell/SmartShell.svelte";
  import type { LayoutData } from "./$types";

  interface Props {
    data: LayoutData;
    children: Snippet;
  }

  let { data, children }: Props = $props();
</script>

<SmartShell session={data.session}>
  {@render children()}
</SmartShell>
