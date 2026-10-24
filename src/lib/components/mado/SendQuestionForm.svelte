<script lang="ts">
  import { Send, AlertCircle, CheckCircle2 } from "lucide-svelte";
  import Button from "$lib/components/ui/Button.svelte";
  import Textarea from "$lib/components/ui/Textarea.svelte";

  interface Props {
    boxOwnerDid: string;
    boxRkey: string;
    senderHandle: string;
    onSuccess?: () => void;
  }

  let { boxOwnerDid, boxRkey, senderHandle, onSuccess }: Props = $props();

  type FormState = "idle" | "submitting" | "success" | "error";

  const MAX_CHARS = 500;

  let body = $state("");
  let formState = $state<FormState>("idle");
  let errorMsg = $state("");

  const isValid = $derived(body.trim().length > 0 && body.length <= MAX_CHARS);

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    if (!isValid || formState === "submitting") return;

    formState = "submitting";
    errorMsg = "";

    try {
      const res = await fetch("/api/questions/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: body.trim(), boxOwnerDid, boxRkey }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { message?: string };
        throw new Error(data.message ?? "送信に失敗しました");
      }

      formState = "success";
      body = "";
      onSuccess?.();
    } catch (err) {
      formState = "error";
      errorMsg = err instanceof Error ? err.message : "送信に失敗しました";
    }
  }
</script>

{#if formState === "success"}
  <div data-suisou-item="notice" data-suisou-layout="stack center" data-suisou-text="center" data-suisou="success p-4" role="status" class="done">
    <CheckCircle2 class="big" />
    <div data-suisou-layout="stack gap-1 center">
      <p data-suisou-text="fs-16 fw-700">声を送信しました！</p>
      <p data-suisou-text="fs-14" data-suisou="note">相手に届くまでしばらくお待ちください。</p>
    </div>
    <Button variant="ghost" onclick={() => (formState = "idle")}>別の声を送る</Button>
  </div>
{:else}
  <form onsubmit={handleSubmit} data-suisou-layout="stack gap-3" class="form">
    <Textarea
      label="声の内容"
      bind:value={body}
      maxlength={MAX_CHARS}
      showCount={true}
      rows={5}
      helper={`この声は @${senderHandle} からの声として窓のオーナーに届きます。`}
      disabled={formState === "submitting"}
      error={body.length > MAX_CHARS ? `${MAX_CHARS}文字以内で入力してください` : undefined}
    />

    {#if formState === "error"}
      <p data-suisou-item="notice" data-suisou-layout="row" data-suisou="error" role="alert">
        <AlertCircle />
        {errorMsg}
      </p>
    {/if}

    <div data-suisou-layout="row end">
      <Button
        type="submit"
        variant="default"
        loading={formState === "submitting"}
        disabled={!isValid}
      >
        {#snippet rightIcon()}<Send />{/snippet}
        声を送る
      </Button>
    </div>
  </form>
{/if}

<style>
  .done :global(.big) {
    width: 2.5rem;
    height: 2.5rem;
    color: var(--suisou-color-success);
  }
</style>
