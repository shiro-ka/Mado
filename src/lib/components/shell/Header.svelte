<script lang="ts">
  import Brand from "./Brand.svelte";
  import LoginButton from "./LoginButton.svelte";
</script>

<header data-suisou-layout="row between" data-suisou="w-full px-3" class="bar">
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
    margin-inline: auto;
    max-width: 72rem;
    height: 4rem;
  }
</style>
