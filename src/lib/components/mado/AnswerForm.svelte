<script lang="ts">
  import { Send, AlertCircle, CheckCircle2, ExternalLink } from "lucide-svelte";
  import Button from "$lib/components/ui/Button.svelte";
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
  <!-- ★Suisou の banner。banner.css には「wixdex の3現場が同じ箱を手書きしていて
       3回ルールで昇格した」とある ―― Mado も同じ箱を手書きしていた。
       意味（role）は CSS では足せないので現場が書く、というのが Suisou の約束。 -->
  <div data-suisou-banner="success" data-suisou-layout="stack" role="status" data-suisou-text="center" class="done">
    <CheckCircle2 class="big" />
    <div data-suisou-layout="stack gap-1" class="center">
      <p data-suisou-text="s16 w700">回答を投稿しました</p>
      <p data-suisou-text="s14" class="sub">PDSに保存されました。</p>
      {#if crosspostFailed}
        <p data-suisou-layout="row" data-suisou-text="s14" class="warn">
          <AlertCircle />
          Blueskyへの転載は失敗しました
        </p>
      {:else if crosspostLink}
        <a
          data-suisou-layout="row"
          data-suisou-text="s14"
          data-suisou-link
          href={crosspostLink}
          target="_blank"
          rel="noopener noreferrer"
        >
          <ExternalLink />
          Blueskyの投稿を見る
        </a>
      {/if}
    </div>
    <Button variant="ghost" onclick={reset}>続けて回答する</Button>
  </div>
{:else}
  <form onsubmit={handleSubmit} data-suisou-layout="stack gap-3" class="form">
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
      <p data-suisou-banner="error" data-suisou-layout="row" role="alert">
        <AlertCircle />
        {errorMsg}
      </p>
    {/if}

    <div data-suisou-layout="row between wrap">
      <label data-suisou-layout="row" class="check">
        <input
          type="checkbox"
          bind:checked={crosspost}
          disabled={formState === "submitting"}
        />
        <span data-suisou-text="s12" class="sub">Bskyにもポスト</span>
      </label>
      <Button
        variant="outline"
        type="submit"
        loading={formState === "submitting"}
        disabled={!isValid}
      >
        {#snippet rightIcon()}<Send />{/snippet}
        回答を投稿
      </Button>
    </div>
  </form>
{/if}

<style>
  .done {
    padding: var(--suisou-space-4);
  }
  .center {
    align-items: center;
  }
  .sub {
    color: var(--suisou-text-sub);
  }
  .warn {
    color: var(--suisou-warning);
  }
  .check {
    cursor: pointer;
    user-select: none;
  }
  .check input {
    accent-color: var(--suisou-accent);
    width: 1rem;
    height: 1rem;
    cursor: pointer;
  }
  :global(.big) {
    width: 2.25rem;
    height: 2.25rem;
    color: var(--suisou-success);
  }
</style>
