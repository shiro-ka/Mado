<script lang="ts">
  import { LogOut } from "lucide-svelte";
  import type { AppSession } from "$lib/store.js";

  interface Props {
    session: AppSession;
  }

  let { session }: Props = $props();
</script>

<div data-suisou-layout="stack" class="card">
  <div data-suisou-layout="row">
    {#if session.avatar}
      <img src={session.avatar} alt={session.handle} data-suisou-item="circle" />
    {:else}
      <div data-suisou-item="circle">{session.handle[0]?.toUpperCase() ?? "?"}</div>
    {/if}
    <div data-suisou-layout="grow stack gap-0" class="who">
      <p data-suisou-text="fs-14 fw-500 clamp-1" class="ellipsis">
        {session.displayName ?? session.handle}
      </p>
      <p data-suisou-text="fs-12 clamp-1" class="ellipsis sub">@{session.handle}</p>
    </div>
  </div>
  <form action="/api/auth/logout" method="POST">
    <button type="submit" data-suisou-button="block">
      <LogOut />
      ログアウト
    </button>
  </form>
</div>

<style>
  .card {
    flex: none;
    padding: var(--suisou-space-2);
  }
  .sub {
    color: var(--suisou-color-text-note);
  }
</style>
