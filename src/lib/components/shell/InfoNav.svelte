<script lang="ts">
  import { ChevronDown, Info, BookOpen, Eye } from "lucide-svelte";

  interface Props {
    onNavigate?: () => void;
  }

  let { onNavigate }: Props = $props();

  let open = $state(false);

  const items = [
    { href: "/about", icon: Info, label: "Madoについて" },
    { href: "/guide", icon: BookOpen, label: "使い方" },
    { href: "/semi-anon", icon: Eye, label: "半匿名の仕組み" },
  ];
</script>

<div>
  <button
    onclick={() => (open = !open)}
    class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 text-muted cursor-pointer"
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
        <a
          href={item.href}
          onclick={onNavigate}
          class="flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all duration-200 text-subtle"
        >
          <item.icon size={15} class="shrink-0" />
          {item.label}
        </a>
      {/each}
    </div>
  {/if}
</div>
