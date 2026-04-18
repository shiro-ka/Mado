<script lang="ts">
  import { LogOut } from "lucide-svelte";
  import type { AppSession } from "$lib/store.js";

  interface Props {
    session: AppSession;
  }

  let { session }: Props = $props();
</script>

<div class="p-4 shrink-0 border-t border-border">
  <div class="flex items-center gap-3 mb-3">
    {#if session.avatar}
      <img
        src={session.avatar}
        alt={session.handle}
        class="w-9 h-9 rounded-full object-cover shrink-0"
      />
    {:else}
      <div class="w-9 h-9 rounded-full flex items-center justify-center shrink-0 font-bold text-sm bg-accent text-white">
        {session.handle[0]?.toUpperCase() ?? "?"}
      </div>
    {/if}
    <div class="min-w-0">
      <p class="text-sm font-medium truncate text-primary">
        {session.displayName ?? session.handle}
      </p>
      <p class="text-xs truncate text-muted">@{session.handle}</p>
    </div>
  </div>
  <form action="/api/auth/logout" method="POST">
    <button
      type="submit"
      class="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all duration-200 cursor-pointer text-subtle"
    >
      <LogOut size={15} />
      ログアウト
    </button>
  </form>
</div>
