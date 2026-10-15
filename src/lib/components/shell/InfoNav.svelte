<script lang="ts">
  import { untrack } from "svelte";
  import { page } from "$app/state";
  import { ChevronDown, Info, BookOpen, Eye } from "lucide-svelte";

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
    data-suisou-button="block"
  >
    <Info data-suisou-text="fs-20" />
    <span data-suisou-layout="grow" data-suisou-text="start" class="label">Madoについて</span>
    <ChevronDown
      size={14}
      style="transition: transform 0.2s; transform: {open ? 'rotate(180deg)' : 'rotate(0deg)'}"
    />
  </button>
  {#if open}
    <div data-suisou-layout="stack" class="sub">
      {#each items as item}
        {@const active = currentPath === item.href}
        <a
          href={item.href}
          onclick={onNavigate}
          aria-current={active ? "page" : undefined}
          data-suisou-button="block"
        >
          <item.icon data-suisou-text="fs-16" />
          {item.label}
        </a>
      {/each}
    </div>
  {/if}
</div>

<style>

  /* 入れ子のぶんだけ字下げ。字下げの幅は現場のもの */
  .sub {
    padding-inline-start: var(--suisou-space-3);
  }
</style>
