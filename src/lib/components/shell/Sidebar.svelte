<script lang="ts">
  import { page } from "$app/state";
  import { Inbox, Send, User, Settings, Info } from "lucide-svelte";
  import UserCard from "./UserCard.svelte";
  import Brand from "./Brand.svelte";
  import Credits from "./Credits.svelte";
  import type { AppSession } from "$lib/store.js";

  interface Props {
    session: AppSession;
    officialHandle?: string | null;
    onNavigate?: () => void;
  }

  let { session, officialHandle = null, onNavigate }: Props = $props();

  const navItems = $derived([
    { href: "/receive", icon: Inbox, label: "受信トレイ" },
    { href: `/@${session.handle}`, icon: User, label: "マイページ" },
    { href: "/sent", icon: Send, label: "送信トレイ" },
    { href: "/settings", icon: Settings, label: "設定" },
    { href: "/about", icon: Info, label: "Madoについて" },
  ]);

  const currentPath = $derived(page.url.pathname);
</script>

<div data-suisou-layout="row" class="brandbar">
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
  </div>
</nav>

<UserCard {session} />

<Credits {officialHandle} />

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
