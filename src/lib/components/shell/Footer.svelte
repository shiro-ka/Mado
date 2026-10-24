<script lang="ts">
  import Credits from "./Credits.svelte";

  interface Props {
    officialHandle?: string | null;
  }

  let { officialHandle = null }: Props = $props();
</script>

<footer>
  <Credits {officialHandle} />
</footer>

