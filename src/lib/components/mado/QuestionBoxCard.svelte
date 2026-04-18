<script lang="ts">
  import { MessageCircle, ChevronRight, Lock, Unlock } from "lucide-svelte";
  import Badge from "$lib/components/ui/Badge.svelte";
  import { boxUrl } from "$lib/utils.js";
  import type { QuestionBox } from "$lib/../types/index.js";

  interface Props {
    box: QuestionBox;
    ownerHandle: string;
    questionCount?: number;
  }

  let { box, ownerHandle, questionCount }: Props = $props();

  const href = $derived(boxUrl(ownerHandle, box.slug));
</script>

<a {href} class="group block">
  <div class="rounded-xl p-5 transition-all duration-200 group-hover:scale-[1.01] bg-surface border border-border hover:border-border-strong">
    <div class="flex items-start justify-between gap-3">
      <div class="flex items-start gap-3 min-w-0">
        <div class="mt-0.5 w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors duration-200 bg-accent-light">
          <MessageCircle size={16} class="text-blue-400" />
        </div>
        <div class="min-w-0">
          <h3 class="font-semibold text-sm leading-snug truncate text-primary">{box.title}</h3>
          {#if box.description}
            <p class="text-xs mt-1 line-clamp-2 text-muted">{box.description}</p>
          {/if}
        </div>
      </div>

      <ChevronRight
        size={16}
        class="shrink-0 mt-0.5 opacity-40 group-hover:opacity-80 transition-opacity duration-200 text-subtle"
      />
    </div>

    <div class="flex items-center gap-2 mt-3">
      <Badge variant={box.isOpen ? "success" : "muted"} dot>
        {box.isOpen ? "受付中" : "受付停止"}
      </Badge>
      {#if box.isOpen}
        <span class="text-subtle"><Unlock size={12} /></span>
      {:else}
        <span class="text-subtle"><Lock size={12} /></span>
      {/if}
      {#if questionCount !== undefined}
        <span class="text-xs ml-auto text-subtle">質問 {questionCount}件</span>
      {/if}
    </div>
  </div>
</a>
