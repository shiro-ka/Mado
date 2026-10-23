<script lang="ts">
  import Credits from "./Credits.svelte";

  interface Props {
    officialHandle?: string | null;
  }

  let { officialHandle = null }: Props = $props();
</script>

<footer data-suisou="bd-top" class="foot">
  <Credits {officialHandle} />
</footer>

<style>
  .foot {
    width: 100%;
    margin-block-start: auto;
    background: var(--suisou-color-panel);
  }
</style>
