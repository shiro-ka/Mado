<script lang="ts">
  import Brand from "./Brand.svelte";
  import LoginButton from "./LoginButton.svelte";
</script>

<header data-suisou-layout="row between" data-suisou="container-m px-3 py-3">
  <a href="/">
    <Brand size="lg" beta />
  </a>
  <div data-suisou-layout="stack s:row">
    <LoginButton label="ログイン" />
    <LoginButton look="other" label="bsky.social以外のPDS" />
  </div>
</header>
