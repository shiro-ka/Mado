<script lang="ts">
  import { Send, AlertCircle, CheckCircle2, ExternalLink } from "lucide-svelte";
  import Button from "$lib/components/ui/button/button.svelte";
  import Textarea from "$lib/components/ui/Textarea.svelte";
  import { bskyPostUrl } from "$lib/utils.js";

  interface Props {
    koeUri: string;
    questionBody?: string;
    pageUrl?: string;
    onSuccess?: (answerUri: string) => void;
  }

  let { koeUri, questionBody, pageUrl, onSuccess }: Props = $props();

  type FormState = "idle" | "submitting" | "success" | "error";

  const MAX_CHARS = 1000;

  let body = $state("");
  let crosspost = $state(false);
  let formState = $state<FormState>("idle");
  let errorMsg = $state("");
  let crosspostFailed = $state(false);
  let crosspostLink = $state<string | null>(null);

  function reset() {
    body = "";
    crosspost = false;
    crosspostFailed = false;
    crosspostLink = null;
    errorMsg = "";
    formState = "idle";
  }

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
        body: JSON.stringify({ koeUri, body: body.trim(), crosspost, pageUrl, questionBody }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { message?: string };
        throw new Error(data.message ?? "回答の投稿に失敗しました");
      }

      const data = await res.json() as {
        uri: string;
        crossposted?: boolean;
        crosspostUri?: string | null;
      };
      crosspostFailed = crosspost && data.crossposted === false;
      crosspostLink = data.crosspostUri ? bskyPostUrl(data.crosspostUri) : null;
      formState = "success";
      onSuccess?.(data.uri);
    } catch (err) {
      formState = "error";
      errorMsg = err instanceof Error ? err.message : "回答の投稿に失敗しました";
    }
  }
</script>

{#if formState === "success"}
  <div data-suisou-layout="stack" class="rounded-lg p-6 text-center bg-emerald-400/8 border border-emerald-400/25">
    <CheckCircle2 size={36} class="text-emerald-400" />
    <div>
      <p data-suisou-text="w700" class="text-foreground">回答を投稿しました</p>
      <p class="mt-1 text-muted-foreground">PDSに保存されました。</p>
      {#if crosspostFailed}
        <p class="mt-2 flex items-center justify-center gap-1.5 text-amber-400">
          <AlertCircle size={14} />
          Blueskyへの転載は失敗しました
        </p>
      {:else if crosspostLink}
        <a
          href={crosspostLink}
          target="_blank"
          rel="noopener noreferrer"
          class="mt-2 inline-flex items-center justify-center gap-1.5 text-blue-400 hover:opacity-80 transition-opacity"
        >
          <ExternalLink size={14} />
          Blueskyの投稿を見る
        </a>
      {/if}
    </div>
    <Button variant="ghost" size="sm" onclick={reset} class="mt-1">
      続けて回答する
    </Button>
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
      <div data-suisou-layout="row" class="rounded-lg p-3 bg-red-400/8 border border-red-400/25 text-error">
        <AlertCircle size={15} />
        {errorMsg}
      </div>
    {/if}

    <div data-suisou-layout="row" class="justify-between flex-wrap">
      <label data-suisou-layout="row" class="cursor-pointer select-none">
        <input
          type="checkbox"
          bind:checked={crosspost}
          disabled={formState === "submitting"}
          class="w-4 h-4 accent-blue-500 cursor-pointer"
        />
        <span data-suisou-text="s12" class="text-muted-foreground">Bskyにもポスト</span>
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
