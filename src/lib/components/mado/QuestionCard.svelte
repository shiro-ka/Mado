<script lang="ts">
  import { MessageCircle, Lock, CheckCircle2 } from "lucide-svelte";
  import Badge from "$lib/components/ui/Badge.svelte";
  import { cn, formatDate, truncate } from "$lib/utils.js";
  import type { Question } from "$lib/../types/index.js";

  interface Props {
    question: Question;
    preview?: string;
    href?: string;
  }

  let { question, preview, href: hrefProp }: Props = $props();

  const href = $derived(hrefProp ?? `/receive`);
</script>

<a {href} class="group block">
  <div
    class={cn(
      "rounded-xl p-4 transition-all duration-200 group-hover:border-blue-700/40 bg-surface",
      question.isRead ? "border border-border" : "border border-blue-700/35"
    )}
  >
    <div class="flex items-start gap-3">
      <!-- Unread indicator -->
      <div class="mt-1 shrink-0">
        {#if question.isRead}
          <CheckCircle2 size={16} class="text-subtle" />
        {:else}
          <div class="w-2 h-2 rounded-full mt-1.5 bg-accent"></div>
        {/if}
      </div>

      <!-- Content -->
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2 mb-1">
          {#if !question.isRead}
            <Badge variant="default" size="sm">未読</Badge>
          {/if}
          <span class="text-xs ml-auto text-subtle">{formatDate(question.createdAt)}</span>
        </div>

        <div class="flex items-start gap-2">
          {#if preview}
            <p class="text-sm line-clamp-2 text-primary">{truncate(preview, 120)}</p>
          {:else}
            <div class="flex items-center gap-1.5">
              <Lock size={12} class="text-subtle" />
              <span class="text-sm italic text-subtle">暗号化されたメッセージ</span>
            </div>
          {/if}
        </div>

        {#if question.senderHandle}
          <div class="flex items-center gap-1.5 mt-2">
            <MessageCircle size={12} class="text-subtle" />
            <span class="text-xs text-muted">@{question.senderHandle}</span>
          </div>
        {/if}
      </div>
    </div>
  </div>
</a>
