<script lang="ts">
  import { page } from "$app/state";
  import { LayoutDashboard, Inbox, Send, User } from "lucide-svelte";
  import { cn } from "$lib/utils.js";
  import InfoNav from "./InfoNav.svelte";
  import UserCard from "./UserCard.svelte";
  import type { AppSession } from "$lib/store.js";

  interface Props {
    session: AppSession;
    onNavigate?: () => void;
  }

  let { session, onNavigate }: Props = $props();

  const navItems = $derived([
    { href: "/dashboard", icon: LayoutDashboard, label: "ホーム" },
    { href: `/@${session.handle}`, icon: User, label: "マイページ" },
    { href: "/receive", icon: Inbox, label: "受信トレイ" },
    { href: "/sent", icon: Send, label: "送信トレイ" },
  ]);

  const currentPath = $derived(page.url.pathname);
</script>

<!-- Logo -->
<div class="h-16 px-5 flex items-center gap-2 shrink-0 border-b border-border">
  <a href="/dashboard" class="flex items-center gap-2" onclick={onNavigate}>
    <img src="/mado-logo.svg" alt="Mado" class="w-8 h-8" />
    <span class="font-bold text-base text-foreground">Mado</span>
  </a>
</div>

<!-- Navigation -->
<nav class="flex-1 py-4 px-3 overflow-y-auto">
  <div class="flex flex-col gap-0.5">
    {#each navItems as item}
      {@const active = currentPath === item.href}
      <a
        href={item.href}
        onclick={onNavigate}
        aria-current={active ? "page" : undefined}
        class={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
          active
            ? "bg-primary-light text-blue-400"
            : "text-muted-foreground hover:bg-elevated hover:text-foreground"
        )}
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
