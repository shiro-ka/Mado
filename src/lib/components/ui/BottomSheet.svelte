<script lang="ts">
  import { X } from "lucide-svelte";
  import type { Snippet } from "svelte";

  interface Props {
    open: boolean;
    title?: string;
    onClose: () => void;
    children: Snippet;
  }

  let { open, title, onClose, children }: Props = $props();

  // While open: lock body scroll and close on Escape.
  $effect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  });
</script>

{#if open}
  <div class="fixed inset-0 z-50 flex flex-col justify-end">
    <button
      class="absolute inset-0 bg-black/50 backdrop-blur-sm"
      aria-label="閉じる"
      onclick={onClose}
    ></button>
    <div class="sheet relative rounded-t-2xl p-5 pb-8 max-h-[85vh] overflow-y-auto bg-surface border-t border-border">
      <div class="mx-auto mb-4 h-1 w-10 rounded-full bg-border-strong"></div>
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-sm font-semibold text-foreground">{title ?? ""}</h3>
        <button
          onclick={onClose}
          class="p-1.5 -mr-1.5 rounded-lg transition-colors text-subtle hover:text-foreground"
          aria-label="閉じる"
        >
          <X size={18} />
        </button>
      </div>
      {@render children()}
    </div>
  </div>
{/if}

<style>
  .sheet {
    animation: slideUp 0.22s cubic-bezier(0.32, 0.72, 0, 1);
  }
  @keyframes slideUp {
    from {
      transform: translateY(100%);
    }
    to {
      transform: translateY(0);
    }
  }
</style>
