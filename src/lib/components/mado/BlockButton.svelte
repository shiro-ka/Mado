<script lang="ts">
  import { Ban, CheckCircle2 } from "lucide-svelte";
  import Button from "$lib/components/ui/Button.svelte";

  interface Props {
    senderDid: string;
  }

  let { senderDid }: Props = $props();

  type State = "idle" | "confirm" | "submitting" | "done" | "unblocking" | "error";
  let state = $state<State>("idle");

  async function handleClick() {
    if (state === "idle" || state === "error") {
      state = "confirm";
      return;
    }

    if (state === "confirm") {
      state = "submitting";
      try {
        const res = await fetch("/api/blocks/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ senderDid }),
        });
        state = res.ok ? "done" : "error";
      } catch {
        state = "error";
      }
    }
  }

  async function handleUnblock() {
    state = "unblocking";
    try {
      const res = await fetch("/api/blocks/remove", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senderDid }),
      });
      state = res.ok ? "idle" : "done";
    } catch {
      state = "done";
    }
  }
</script>

{#if state === "done" || state === "unblocking"}
  <div class="flex items-center gap-2 flex-1 sm:flex-none">
    <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-muted">
      <CheckCircle2 size={14} />
      ブロックしました
    </div>
    <Button
      variant="ghost"
      size="sm"
      loading={state === "unblocking"}
      onclick={handleUnblock}
      class="text-xs text-subtle"
    >
      解除
    </Button>
  </div>
{:else}
  <Button
    variant={state === "confirm" ? "destructive" : "outline"}
    size="sm"
    class="flex-1 sm:flex-none"
    loading={state === "submitting"}
    onclick={handleClick}
  >
    {#snippet leftIcon()}<Ban size={14} />{/snippet}
    {state === "confirm" ? "本当にブロックしますか？" : state === "error" ? "再試行" : "送信者をブロック"}
  </Button>
{/if}
