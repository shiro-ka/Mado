<script lang="ts">
  import { Bell, Ban, Palette, ChevronRight } from "lucide-svelte";

  const items = [
    { href: "/settings/notifications", icon: Bell, label: "通知" },
    { href: "/settings/blocks", icon: Ban, label: "ブロック中の人" },
    { href: "/settings/card", icon: Palette, label: "リンクカードの見た目" },
  ];
</script>

<svelte:head>
  <title>設定 | Mado</title>
</svelte:head>

<div data-suisou-layout="stack gap-3" data-suisou="container-s py-4 px-3">
  <h1 data-suisou-text="fs-24 fw-700">設定</h1>

  <div data-suisou-tray data-suisou-layout="stack gap-0" data-suisou="p-1">
    {#each items as item}
      <a href={item.href} data-suisou-button="block" data-suisou-layout="row" data-suisou="py-3">
        <item.icon data-suisou-text="fs-20" />
        <span data-suisou-layout="grow">{item.label}</span>
        <ChevronRight data-suisou-text="fs-20" data-suisou="note" />
      </a>
    {/each}
  </div>
</div>
