<script lang="ts">
  import { Plus, Edit3, Link2 } from "lucide-svelte";
  import Button from "$lib/components/ui/Button.svelte";
  import Badge from "$lib/components/ui/Badge.svelte";
  import { boxUrl } from "$lib/utils.js";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
</script>

<svelte:head>
  <title>質問箱 | Mado</title>
</svelte:head>

<div class="px-6 py-8 max-w-4xl mx-auto">
  <!-- Header -->
  <div class="flex items-center justify-between mb-8">
    <div>
      <h1 class="text-2xl font-bold text-primary">質問箱</h1>
      <p class="text-sm mt-1 text-muted">{data.boxes.length}件の質問箱</p>
    </div>
    <a href="/dashboard/boxes/new">
      <Button>
        {#snippet leftIcon()}<Plus size={16} />{/snippet}
        新しく作成
      </Button>
    </a>
  </div>

  <!-- Empty state -->
  {#if data.boxes.length === 0}
    <div class="rounded-2xl p-12 flex flex-col items-center gap-4 text-center bg-surface border border-dashed border-border-strong">
      <div class="w-14 h-14 rounded-2xl flex items-center justify-center bg-accent-light">
        <Plus size={24} class="text-blue-400" />
      </div>
      <div>
        <h3 class="font-semibold text-base mb-1 text-primary">質問箱を作成しましょう</h3>
        <p class="text-sm text-muted">
          URLをシェアして、Blueskyのフォロワーから質問を受け付けましょう。
        </p>
      </div>
      <a href="/dashboard/boxes/new">
        <Button>
          {#snippet leftIcon()}<Plus size={16} />{/snippet}
          最初の質問箱を作成
        </Button>
      </a>
    </div>
  {/if}

  <!-- Box list -->
  <div class="flex flex-col gap-4">
    {#each data.boxes as box}
      {@const publicUrl = `${data.appUrl}${boxUrl(data.ownerHandle, box.slug)}`}
      <div class="rounded-xl p-5 bg-surface border border-border">
        <div class="flex items-start justify-between gap-4">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1.5">
              <h3 class="font-semibold text-base text-primary">{box.title}</h3>
              <Badge variant={box.isOpen ? "success" : "muted"} dot size="sm">
                {box.isOpen ? "受付中" : "停止中"}
              </Badge>
            </div>

            {#if box.description}
              <p class="text-sm mb-2 line-clamp-2 text-muted">{box.description}</p>
            {/if}

            <div class="flex items-center gap-1.5">
              <Link2 size={12} class="text-subtle" />
              <a
                href={publicUrl}
                target="_blank"
                rel="noopener noreferrer"
                class="text-xs hover:opacity-80 transition-opacity truncate text-blue-400"
              >
                {publicUrl}
              </a>
            </div>
          </div>

          <div class="flex items-center gap-2 shrink-0">
            <a href={`/dashboard/boxes/${box.rkey}`}>
              <button
                class="p-2 rounded-lg transition-colors duration-200 cursor-pointer text-muted"
                title="編集"
              >
                <Edit3 size={15} />
              </button>
            </a>
          </div>
        </div>
      </div>
    {/each}
  </div>
</div>
