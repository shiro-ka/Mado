<script lang="ts">
  import { untrack } from "svelte";
  import { page } from "$app/state";
  import { ChevronDown, Info, BookOpen, Eye } from "lucide-svelte";
  import { cn } from "$lib/utils.js";

  interface Props {
    onNavigate?: () => void;
  }

  let { onNavigate }: Props = $props();

  const items = [
    { href: "/about", icon: Info, label: "Madoについて" },
    { href: "/guide", icon: BookOpen, label: "使い方" },
    { href: "/semi-anon", icon: Eye, label: "半匿名の仕組み" },
  ];

  const currentPath = $derived(page.url.pathname);
  // Start expanded when the user is already on one of these pages.
  let open = $state(untrack(() => items.some((i) => i.href === page.url.pathname)));
</script>

<div>
  <button
    onclick={() => (open = !open)}
    aria-expanded={open}
    class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 text-muted-foreground hover:bg-elevated hover:text-foreground cursor-pointer"
  >
    <Info size={17} class="shrink-0" />
    <span class="flex-1 text-left">Madoについて</span>
    <ChevronDown
      size={14}
      style="transition: transform 0.2s; transform: {open ? 'rotate(180deg)' : 'rotate(0deg)'}"
    />
  </button>
  {#if open}
    <div class="mt-0.5 flex flex-col gap-0.5 pl-4">
      {#each items as item}
        {@const active = currentPath === item.href}
        <a
          href={item.href}
          onclick={onNavigate}
          aria-current={active ? "page" : undefined}
          class={cn(
            "flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all duration-200",
            active ? "bg-primary-light text-blue-400" : "text-subtle hover:bg-elevated hover:text-foreground"
          )}
        >
          <item.icon size={15} class="shrink-0" />
          {item.label}
        </a>
      {/each}
    </div>
  {/if}
</div>
