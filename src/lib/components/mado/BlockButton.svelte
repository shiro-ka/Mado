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
  <div data-suisou-layout="row wrap" class="bar">
    <!-- 状態のしるしであって押せるものではないので Tag。旧実装はボタン風の箱だった -->
    <span data-suisou-tag>
      <CheckCircle2 />
      ブロック中
    </span>
    <Button variant="ghost" loading={state === "unblocking"} onclick={unblock}>解除</Button>
    {#if state === "unblock-error"}
      <span data-suisou-layout="row gap-1" data-suisou-text="s12" class="err">
        <AlertCircle data-suisou-icon="small" />
        解除に失敗しました
      </span>
    {/if}
  </div>
{:else}
  <div data-suisou-layout="row wrap" class="bar">
    <Button
      variant={state === "confirm" ? "destructive" : "secondary"}
      loading={state === "blocking"}
      onclick={handlePrimary}
    >
      {#snippet leftIcon()}<Ban />{/snippet}
      {state === "confirm"
        ? "本当にブロックしますか？"
        : state === "block-error"
          ? "再試行"
          : "送信者をブロック"}
    </Button>
    {#if state === "confirm"}
      <Button variant="ghost" onclick={() => (state = "idle")}>キャンセル</Button>
    {/if}
    {#if state === "block-error"}
      <span data-suisou-layout="row gap-1" data-suisou-text="s12" class="err">
        <AlertCircle data-suisou-icon="small" />
        ブロックに失敗しました
      </span>
    {/if}
  </div>
{/if}

<style>
  .err {
    color: var(--suisou-error);
  }
</style>
