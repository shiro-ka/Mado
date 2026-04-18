<script lang="ts">
  import { Send, AlertCircle, CheckCircle2 } from "lucide-svelte";
  import Button from "$lib/components/ui/Button.svelte";
  import Textarea from "$lib/components/ui/Textarea.svelte";

  interface Props {
    koeUri: string;
    onSuccess?: (answerUri: string) => void;
  }

  let { koeUri, onSuccess }: Props = $props();

  type FormState = "idle" | "submitting" | "success" | "error";

  const MAX_CHARS = 1000;

  let body = $state("");
  let crosspost = $state(false);
  let formState = $state<FormState>("idle");
  let errorMsg = $state("");

  const isValid = $derived(body.trim().length > 0 && body.length <= MAX_CHARS);

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    if (!isValid || formState === "submitting") return;

    formState = "submitting";
    errorMsg = "";

    try {
      const res = await fetch("/api/answers/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ koeUri, body: body.trim(), crosspost }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { message?: string };
        throw new Error(data.message ?? "回答の投稿に失敗しました");
      }

      const data = await res.json() as { uri: string };
      formState = "success";
      onSuccess?.(data.uri);
    } catch (err) {
      formState = "error";
      errorMsg = err instanceof Error ? err.message : "回答の投稿に失敗しました";
    }
  }
</script>

{#if formState === "success"}
  <div class="rounded-xl p-6 flex flex-col items-center gap-3 text-center bg-emerald-400/8 border border-emerald-400/25">
    <CheckCircle2 size={36} class="text-emerald-400" />
    <div>
      <p class="font-semibold text-primary">回答を投稿しました</p>
      <p class="text-sm mt-1 text-muted">PDSに保存されました。</p>
    </div>
  </div>
{:else}
  <form onsubmit={handleSubmit} class="flex flex-col gap-4">
    <Textarea
      placeholder="回答を入力してください..."
      bind:value={body}
      maxlength={MAX_CHARS}
      showCount={true}
      rows={4}
      disabled={formState === "submitting"}
      error={body.length > MAX_CHARS ? `${MAX_CHARS}文字以内で入力してください` : undefined}
    />

    {#if formState === "error"}
      <div class="rounded-lg p-3 flex items-center gap-2 text-sm bg-red-400/8 border border-red-400/25 text-error">
        <AlertCircle size={15} />
        {errorMsg}
      </div>
    {/if}

    <div class="flex items-center justify-between gap-3 flex-wrap">
      <label class="flex items-center gap-2 cursor-pointer select-none">
        <input
          type="checkbox"
          bind:checked={crosspost}
          disabled={formState === "submitting"}
          class="w-4 h-4 accent-blue-500 cursor-pointer"
        />
        <span class="text-xs text-muted">Bskyにもポスト</span>
      </label>
      <Button
        type="submit"
        loading={formState === "submitting"}
        disabled={!isValid}
      >
        {#snippet rightIcon()}<Send size={15} />{/snippet}
        回答を投稿
      </Button>
    </div>
  </form>
{/if}
