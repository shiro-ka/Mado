<script lang="ts">
  import { page } from "$app/state";
  import { Home, Inbox, Send, User } from "lucide-svelte";
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
    { href: "/home", icon: Home, label: "ホーム" },
    { href: `/@${session.handle}`, icon: User, label: "マイページ" },
    { href: "/receive", icon: Inbox, label: "受信トレイ" },
    { href: "/sent", icon: Send, label: "送信トレイ" },
  ]);

  const currentPath = $derived(page.url.pathname);
</script>

<!-- Logo -->
<div data-suisou-layout="row" class="brandbar">
  <a href="/home" onclick={onNavigate}>
    <Brand size="md" />
  </a>
</div>

<!-- Navigation -->
<nav data-suisou-layout="stack grow scroll" class="nav">
  <div data-suisou-layout="stack">
    {#each navItems as item}
      {@const active = currentPath === item.href}
      <!-- メニューの行 ＝ block ボタン（左寄せ・縦8横16）。
           現在地は aria-current で示し、下地は Suisou が出す -->
      <a
        href={item.href}
        onclick={onNavigate}
        aria-current={active ? "page" : undefined}
        data-suisou-button="block"
      >
        <item.icon size={17} class="shrink-0" />
        {item.label}
      </a>
    {/each}
    <InfoNav {onNavigate} />
  </div>
</nav>

<!-- User info -->
<UserCard {session} />

<style>
  .brandbar {
    height: 4rem;
    flex: none;
    padding-inline: var(--suisou-space-3);
    border-block-end: 1px solid var(--suisou-line-weak);
  }
  .nav {
    padding: var(--suisou-space-2);
  }
</style>
