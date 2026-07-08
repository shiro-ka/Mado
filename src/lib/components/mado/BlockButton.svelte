<script lang="ts">
  import { untrack } from "svelte";
  import { Ban, CheckCircle2, AlertCircle } from "lucide-svelte";
  import Button from "$lib/components/ui/button/button.svelte";

  interface Props {
    senderDid: string;
    isBlocked?: boolean;
  }

  let { senderDid, isBlocked = false }: Props = $props();

  type State =
    | "idle"
    | "confirm"
    | "blocking"
    | "blocked"
    | "unblocking"
    | "block-error"
    | "unblock-error";

  // Seed from the server so the button reflects the real block state on load
  // (previously it always started "idle" and forgot after a navigation).
  let state = $state<State>(untrack(() => (isBlocked ? "blocked" : "idle")));

  async function block() {
    state = "blocking";
    try {
      const res = await fetch("/api/blocks/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senderDid }),
      });
      state = res.ok ? "blocked" : "block-error";
    } catch {
      state = "block-error";
    }
  }

  async function unblock() {
    state = "unblocking";
    try {
      const res = await fetch("/api/blocks/remove", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senderDid }),
      });
      // On failure, surface it instead of pretending the user is still blocked.
      state = res.ok ? "idle" : "unblock-error";
    } catch {
      state = "unblock-error";
    }
  }

  function handlePrimary() {
    if (state === "idle" || state === "block-error") state = "confirm";
    else if (state === "confirm") block();
  }
</script>

{#if state === "blocked" || state === "unblocking" || state === "unblock-error"}
  <div class="flex items-center gap-2 flex-1 sm:flex-none">
    <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-muted-foreground">
      <CheckCircle2 size={14} />
      ブロック中
    </div>
    <Button
      variant="ghost"
      size="sm"
      loading={state === "unblocking"}
      onclick={unblock}
      class="text-xs text-subtle"
    >
      解除
    </Button>
    {#if state === "unblock-error"}
      <span class="flex items-center gap-1 text-xs text-error">
        <AlertCircle size={12} />
        解除に失敗しました
      </span>
    {/if}
  </div>
{:else}
  <div class="flex items-center gap-2 flex-1 sm:flex-none">
    <Button
      variant={state === "confirm" ? "destructive" : "outline"}
      size="sm"
      class="flex-1 sm:flex-none"
      loading={state === "blocking"}
      onclick={handlePrimary}
    >
      {#snippet leftIcon()}<Ban size={14} />{/snippet}
      {state === "confirm"
        ? "本当にブロックしますか？"
        : state === "block-error"
          ? "再試行"
          : "送信者をブロック"}
    </Button>
    {#if state === "confirm"}
      <Button
        variant="ghost"
        size="sm"
        class="text-xs text-subtle"
        onclick={() => (state = "idle")}
      >
        キャンセル
      </Button>
    {/if}
    {#if state === "block-error"}
      <span class="flex items-center gap-1 text-xs text-error">
        <AlertCircle size={12} />
        ブロックに失敗しました
      </span>
    {/if}
  </div>
{/if}
