<script lang="ts">
  import type { Snippet } from "svelte";
  import { Menu, X } from "lucide-svelte";
  import Sidebar from "./Sidebar.svelte";
  import type { AppSession } from "$lib/store.js";

  interface Props {
    session: AppSession;
    children?: Snippet;
  }

  let { session, children }: Props = $props();

  let drawerOpen = $state(false);
  let menuButton = $state<HTMLButtonElement>();
  let closeButton = $state<HTMLButtonElement>();
  let drawerEl = $state<HTMLElement>();

  // Accessibility for the mobile drawer: lock body scroll, move focus in on
  // open and restore it on close, close on Escape, and trap Tab within it.
  $effect(() => {
    if (!drawerOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButton?.focus();

    function onKeydown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        drawerOpen = false;
        return;
      }
      if (e.key === "Tab" && drawerEl) {
        const focusables = drawerEl.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    window.addEventListener("keydown", onKeydown);

    return () => {
      window.removeEventListener("keydown", onKeydown);
      document.body.style.overflow = prevOverflow;
      menuButton?.focus();
    };
  });
</script>

<div class="flex min-h-dvh">
  <!-- Desktop sidebar -->
  <aside class="hidden md:flex w-64 shrink-0 flex-col sticky top-0 h-dvh bg-gray-950 border-r border-gray-800 overflow-y-auto">
    <Sidebar {session} />
  </aside>

  <!-- Mobile topbar -->
  <div class="md:hidden fixed top-0 left-0 right-0 z-40 h-14 flex items-center px-4 gap-3 bg-surface border-b border-border">
    <button
      bind:this={menuButton}
      onclick={() => (drawerOpen = true)}
      class="p-2 rounded-lg text-muted-foreground cursor-pointer"
      aria-label="メニューを開く"
    >
      <Menu size={20} />
    </button>
    <a href="/dashboard" class="flex items-center gap-2">
      <img src="/mado-logo.svg" alt="Mado" class="w-7 h-7" />
      <span class="font-bold text-sm text-foreground">Mado</span>
    </a>
  </div>

  <!-- Mobile drawer -->
  {#if drawerOpen}
    <div
      role="dialog"
      aria-modal="true"
      aria-label="ナビゲーション"
      class="md:hidden fixed inset-0 z-50 flex"
    >
      <button
        class="absolute inset-0 bg-black/50 cursor-default"
        onclick={() => (drawerOpen = false)}
        aria-label="メニューを閉じる"
        tabindex="-1"
      ></button>
      <aside bind:this={drawerEl} class="relative z-10 w-72 flex flex-col h-full bg-surface border-r border-border">
        <button
          bind:this={closeButton}
          onclick={() => (drawerOpen = false)}
          class="absolute top-4 right-4 p-1.5 rounded-lg text-muted-foreground cursor-pointer"
          aria-label="メニューを閉じる"
        >
          <X size={18} />
        </button>
        <Sidebar {session} onNavigate={() => (drawerOpen = false)} />
      </aside>
    </div>
  {/if}

  <!-- Main content -->
  <main class="flex-1 overflow-y-auto md:mt-0 mt-14">
    {#if children}
      {@render children()}
    {/if}
  </main>
</div>
