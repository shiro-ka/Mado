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
  <div class="rounded-xl p-6 flex flex-col items-center gap-3 text-center bg-emerald-400/8 border border-emerald-400/25">
    <CheckCircle2 size={40} class="text-emerald-400" />
    <div>
      <p class="font-semibold text-primary">質問を送信しました！</p>
      <p class="text-sm mt-1 text-muted">相手に届くまでしばらくお待ちください。</p>
    </div>
    <Button variant="ghost" size="sm" onclick={() => (formState = "idle")} class="mt-1">
      別の質問を送る
    </Button>
  </div>
{:else}
  <form onsubmit={handleSubmit} class="flex flex-col gap-4">
    <!-- Sender disclosure -->
    <div class="rounded-lg p-3 flex items-start gap-2.5 text-sm bg-accent-light border border-blue-600/25">
      <AlertCircle size={15} class="mt-0.5 shrink-0 text-blue-400" />
      <p class="text-blue-300">
        この質問は <span class="font-semibold">@{senderHandle}</span> として相手に届きます。
        送り主はボックスのオーナーのみに開示されます。
      </p>
    </div>

    <Textarea
      label="質問内容"
      placeholder="質問を入力してください..."
      bind:value={body}
      maxlength={MAX_CHARS}
      showCount={true}
      rows={5}
      disabled={formState === "submitting"}
      error={body.length > MAX_CHARS ? `${MAX_CHARS}文字以内で入力してください` : undefined}
    />

    {#if formState === "error"}
      <div class="rounded-lg p-3 flex items-center gap-2 text-sm bg-red-400/8 border border-red-400/25 text-error">
        <AlertCircle size={15} />
        {errorMsg}
      </div>
    {/if}

    <Button
      type="submit"
      variant="default"
      size="lg"
      loading={formState === "submitting"}
      disabled={!isValid}
      class="w-full"
    >
      {#snippet rightIcon()}<Send size={16} />{/snippet}
      質問を送る
    </Button>
  </form>
{/if}
