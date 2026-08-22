<script lang="ts">
  import { MessageCircle, Lock, CheckCircle2 } from "lucide-svelte";
  import { Badge } from "$lib/components/ui/badge";
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
  <!-- 未読は枠だけアクセント色に。面と余白と罫は Suisou の panel -->
  <div data-suisou-surface="panel" class="card" class:unread={!question.isRead}>
    <div class="flex items-start gap-3">
      <!-- Unread indicator -->
      <div class="mt-1 shrink-0">
        {#if question.isRead}
          <CheckCircle2 size={16} class="text-subtle" />
        {:else}
          <div class="w-2 h-2 rounded-full mt-1.5 bg-primary"></div>
        {/if}
      </div>

      <!-- Content -->
      <div class="flex-1 min-w-0">
        <div data-suisou-layout="row" class="mb-1">
          {#if !question.isRead}
            <Badge variant="default" size="sm">未読</Badge>
          {/if}
          <span class="text-xs ml-auto text-subtle">{formatDate(question.createdAt)}</span>
        </div>

        <div class="flex items-start gap-2">
          {#if preview}
            <p class="line-clamp-2 text-foreground">{truncate(preview, 120)}</p>
          {:else}
            <div class="flex items-center gap-1.5">
              <Lock size={12} class="text-subtle" />
              <span class="italic text-subtle">暗号化されたメッセージ</span>
            </div>
          {/if}
        </div>

        {#if question.senderHandle}
          <div class="flex items-center gap-1.5 mt-2">
            <MessageCircle size={12} class="text-subtle" />
            <span class="text-xs text-muted-foreground">@{question.senderHandle}</span>
          </div>
        {/if}
      </div>
    </div>
  </div>
</a>

<style>
  .card {
    transition: border-color var(--suisou-motion-fast) var(--suisou-ease);
  }
  .unread,
  :global(.group:hover) .card {
    border-color: var(--suisou-accent);
  }
</style>
