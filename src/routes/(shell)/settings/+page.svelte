<script lang="ts">
  import { Bell, Ban, ChevronRight } from "lucide-svelte";

  const items = [
    { href: "/settings/notifications", icon: Bell, label: "通知" },
    { href: "/settings/blocks", icon: Ban, label: "ブロック中の人" },
  ];
</script>

<svelte:head>
  <title>設定 | Mado</title>
</svelte:head>

<div data-suisou-layout="stack gap-3" data-suisou="container-s" class="page">
  <h1 data-suisou-text="fs-24 fw-700">設定</h1>

  <div data-suisou-tray data-suisou-layout="stack gap-0" class="list">
    {#each items as item}
      <a href={item.href} data-suisou-button="block" data-suisou-layout="row" class="item">
        <item.icon data-suisou-text="fs-20" />
        <span data-suisou-layout="grow">{item.label}</span>
        <ChevronRight data-suisou-text="fs-20" data-suisou="note" />
      </a>
    {/each}
  </div>
</div>

<style>
  .page {
    padding: var(--suisou-space-4) var(--suisou-space-3);
  }
  .list {
    padding: var(--suisou-space-1);
  }
  .item {
    padding-block: var(--suisou-space-3);
  }
</style>
