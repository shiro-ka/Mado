<script lang="ts">
  import { onMount } from "svelte";

  interface Props {
    officialHandle?: string | null;
  }

  let { officialHandle = null }: Props = $props();

  let themeLabel = $state("");
  onMount(() => {
    themeLabel = (document.documentElement.dataset.suisouTheme ?? "").split(" ").join(" x ");
  });
</script>

<footer data-suisou="bd-top" class="foot">
  <div data-suisou-layout="stack gap-2 center" data-suisou-text="fs-12 center" class="inner">
    <div data-suisou-layout="row gap-3 center">
      {#if officialHandle}
        <a href={`https://bsky.app/profile/${officialHandle}`} target="_blank" rel="noopener noreferrer" data-suisou-text="link" class="sub">Bluesky</a>
      {/if}
      <a href="https://github.com/shiro-ka/Mado" target="_blank" rel="noopener noreferrer" data-suisou-text="link" class="sub">GitHub</a>
    </div>
    <div data-suisou-layout="stack gap-0 center" class="sub">
      <span>Suisou</span>
      <span>{themeLabel}</span>
    </div>
  </div>
</footer>

<style>
  .foot {
    width: 100%;
    margin-block-start: auto;
    background: var(--suisou-color-panel);
  }
  .inner {
    padding: var(--suisou-space-4) var(--suisou-space-3);
  }
  .sub {
    color: var(--suisou-color-text-note);
  }
  a.sub:hover {
    color: var(--suisou-color-text);
  }
</style>
