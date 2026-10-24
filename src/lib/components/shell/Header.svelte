<script lang="ts">
  import Brand from "./Brand.svelte";
  import LoginButton from "./LoginButton.svelte";
</script>

<header data-suisou-layout="row between" class="bar">
  <a href="/">
    <Brand size="lg" beta />
  </a>
  <div data-suisou-layout="stack s:row">
    <LoginButton label="ログイン" />
    <LoginButton look="other" label="bsky.social以外のPDS" />  
  </div>
</header>

<style>
  .bar {
    width: 100%;
    margin-inline: auto;
    max-width: 72rem;
    padding-inline: var(--suisou-space-3);
    height: 4rem;
  }
</style>
