<script lang="ts">
  import { MessageCircle, ChevronRight, Lock, Unlock, Pin } from "lucide-svelte";
  import { Badge } from "$lib/components/ui/badge";
  import { boxUrl } from "$lib/utils.js";
  import type { QuestionBox } from "$lib/../types/index.js";

  interface Props {
    box: QuestionBox;
    ownerHandle: string;
    questionCount?: number;
    isMain?: boolean;
  }

  let { box, ownerHandle, questionCount, isMain = false }: Props = $props();

  const href = $derived(boxUrl(ownerHandle, box.slug));
</script>

<a {href} class="group block">
  <div data-suisou-surface="panel" class="p-5 transition-all duration-200 group-hover:scale-[1.01] hover:border-border-strong">
    <div class="flex items-start justify-between gap-3">
      <div class="flex items-start gap-3 min-w-0">
        <div class="mt-0.5 w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors duration-200 bg-primary-light">
          <MessageCircle size={16} class="text-blue-400" />
        </div>
        <div class="min-w-0">
          <h3 class="font-semibold leading-snug truncate text-foreground">{box.title}</h3>
          {#if box.description}
            <p class="text-xs mt-1 line-clamp-2 text-muted-foreground">{box.description}</p>
          {/if}
        </div>
      </div>

      <ChevronRight
        size={16}
        class="shrink-0 mt-0.5 opacity-40 group-hover:opacity-80 transition-opacity duration-200 text-subtle"
      />
    </div>

    <div data-suisou-layout="row" class="mt-3">
      {#if isMain}
        <Badge variant="default" size="sm">
          <Pin size={11} class="mr-0.5" />
          メイン
        </Badge>
      {/if}
      <Badge variant={box.isOpen ? "success" : "muted"} dot>
        {box.isOpen ? "受付中" : "受付停止"}
      </Badge>
      {#if box.isOpen}
        <span class="text-subtle"><Unlock size={12} /></span>
      {:else}
        <span class="text-subtle"><Lock size={12} /></span>
      {/if}
      {#if questionCount !== undefined}
        <span class="text-xs ml-auto text-subtle">声 {questionCount}件</span>
      {/if}
    </div>
  </div>
</a>
