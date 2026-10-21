<script lang="ts">
  import { page } from "$app/state";
  import { Inbox, Send, User, Settings } from "lucide-svelte";
  import InfoNav from "./InfoNav.svelte";
  import UserCard from "./UserCard.svelte";
  import Brand from "./Brand.svelte";
  import type { AppSession } from "$lib/store.js";

  interface Props {
    session: AppSession;
    onNavigate?: () => void;
  }

  let { session, onNavigate }: Props = $props();

  const navItems = $derived([
    { href: "/receive", icon: Inbox, label: "受信トレイ" },
    { href: `/@${session.handle}`, icon: User, label: "マイページ" },
    { href: "/sent", icon: Send, label: "送信トレイ" },
    { href: "/settings", icon: Settings, label: "設定" },
  ]);

  const currentPath = $derived(page.url.pathname);
</script>

<div data-suisou-layout="row" data-suisou="bd-bottom" class="brandbar">
  <a href="/receive" onclick={onNavigate}>
    <Brand size="md" />
  </a>
</div>

<nav data-suisou-layout="stack grow" class="nav">
  <div data-suisou-layout="stack">
    {#each navItems as item}
      {@const active = currentPath === item.href || currentPath.startsWith(`${item.href}/`)}
      <a
        href={item.href}
        onclick={onNavigate}
        aria-current={active ? "page" : undefined}
        data-suisou-button="block"
      >
        <item.icon data-suisou-text="fs-20" />
        {item.label}
      </a>
    {/each}
    <InfoNav {onNavigate} />
  </div>
</nav>

<UserCard {session} />

<style>
  .brandbar {
    height: 4rem;
    flex: none;
    padding-inline: var(--suisou-space-3);
  }
  .nav {
    padding: var(--suisou-space-2);
    overflow-y: auto;
  }
</style>
