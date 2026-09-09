<script lang="ts">
  import { LogOut } from "lucide-svelte";
  import type { AppSession } from "$lib/store.js";

  interface Props {
    session: AppSession;
  }

  let { session }: Props = $props();
</script>

<div data-suisou-layout="stack" data-suisou-rule="top" class="card">
  <div data-suisou-layout="row">
    {#if session.avatar}
      <!-- 画像も頭文字も同じ部品が受ける。円形＝人という約束ごと Suisou に -->
      <img src={session.avatar} alt={session.handle} data-suisou-avatar />
    {:else}
      <div data-suisou-avatar>{session.handle[0]?.toUpperCase() ?? "?"}</div>
    {/if}
    <div data-suisou-layout="grow stack gap-0" class="who">
      <p data-suisou-text="s14 w500 one-line" class="ellipsis">
        {session.displayName ?? session.handle}
      </p>
      <p data-suisou-text="s12 one-line" class="ellipsis sub">@{session.handle}</p>
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
    color: var(--suisou-text-sub);
  }
</style>
