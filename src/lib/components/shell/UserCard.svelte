<script lang="ts">
  import { LogOut, ChevronsUpDown } from "lucide-svelte";
  import { page } from "$app/state";
  import type { AppSession } from "$lib/store.js";
  import { MAX_ACCOUNTS, type AccountSummary } from "$lib/accounts.js";
  import LoginButton from "./LoginButton.svelte";

  interface Props {
    session: AppSession;
  }

  let { session }: Props = $props();

  const accounts = $derived((page.data.accounts ?? []) as AccountSummary[]);
  const others = $derived(accounts.filter((a) => !a.active));
  let open = $state(false);
</script>

{#snippet who(a: { handle: string; displayName?: string; avatar?: string })}
  {#if a.avatar}
    <img src={a.avatar} alt="" data-suisou-item="circle" />
  {:else}
    <div data-suisou-item="circle">{a.handle[0]?.toUpperCase() ?? "?"}</div>
  {/if}
  <span data-suisou-layout="grow stack gap-0" class="who">
    <span data-suisou-text="fs-14 fw-500 clamp-1" class="ellipsis">{a.displayName ?? a.handle}</span>
    <span data-suisou-text="fs-12 clamp-1" data-suisou="note" class="ellipsis">@{a.handle}</span>
  </span>
{/snippet}

<div data-suisou-layout="stack" data-suisou="p-2" class="card">
  <button
    type="button"
    data-suisou-button="block"
    data-suisou-layout="row"
    aria-expanded={open}
    onclick={() => (open = !open)}
  >
    {@render who(session)}
    <ChevronsUpDown data-suisou-text="fs-16" data-suisou="note" />
  </button>

  {#if open}
    {#each others as account (account.did)}
      <form action="/api/auth/switch" method="POST">
        <input type="hidden" name="did" value={account.did} />
        <button type="submit" data-suisou-button="block" data-suisou-layout="row" aria-label={`@${account.handle} に切り替える`}>
          {@render who(account)}
        </button>
      </form>
    {/each}
    {#if accounts.length < MAX_ACCOUNTS}
      <LoginButton variant="ghost" label="アカウントを追加" addAccount />
      <LoginButton look="other" label="ほかのサーバーのアカウントを追加" addAccount />
    {/if}
  {/if}

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
  }
  .who {
    min-width: 0;
    text-align: start;
  }
</style>
