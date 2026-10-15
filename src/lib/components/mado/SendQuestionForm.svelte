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
  <div data-suisou-item="notice" data-suisou-layout="stack" data-suisou-text="center" data-suisou="success" role="status" class="done">
    <CheckCircle2 class="big" />
    <div data-suisou-layout="stack gap-1 center">
      <p data-suisou-text="fs-16 fw-700">声を送信しました！</p>
      <p data-suisou-text="fs-14" class="sub">相手に届くまでしばらくお待ちください。</p>
    </div>
    <Button variant="ghost" onclick={() => (formState = "idle")}>別の声を送る</Button>
  </div>
{:else}
  <form onsubmit={handleSubmit} data-suisou-layout="stack gap-3" class="form">
    <div data-suisou-item="media" class="notice">
      <AlertCircle data-suisou-item="media-figure" data-suisou-text="fs-20" data-suisou="accent" />
      <p data-suisou-item="media-content" data-suisou-text="fs-14">
        この声は <strong>@{senderHandle}</strong> として相手に届きます。
        送り主は窓のオーナーのみに開示されます。
      </p>
    </div>

    <Textarea
      label="声の内容"
      placeholder="声を入力してください..."
      bind:value={body}
      maxlength={MAX_CHARS}
      showCount={true}
      rows={5}
      disabled={formState === "submitting"}
      error={body.length > MAX_CHARS ? `${MAX_CHARS}文字以内で入力してください` : undefined}
    />

    {#if formState === "error"}
      <p data-suisou-item="notice" data-suisou-layout="row" data-suisou="error" role="alert">
        <AlertCircle />
        {errorMsg}
      </p>
    {/if}

    <Button
      type="submit"
      variant="default"
      wide
      loading={formState === "submitting"}
      disabled={!isValid}
    >
      {#snippet rightIcon()}<Send />{/snippet}
      声を送る
    </Button>
  </form>
{/if}

<style>
  .done {
    padding: var(--suisou-space-4);
  }
  .sub {
    color: var(--suisou-color-text-sub);
  }
  .notice {
    border-color: var(--suisou-color-accent);
  }
  .notice :global(svg) {
    margin-block-start: 0.15rem;
  }
  :global(.big) {
    width: 2.5rem;
    height: 2.5rem;
    color: var(--suisou-color-success);
  }
</style>
