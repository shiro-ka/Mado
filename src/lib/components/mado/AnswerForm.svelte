<script lang="ts">
  import { onMount } from "svelte";
  import { Send, AlertCircle, CheckCircle2, ExternalLink } from "lucide-svelte";
  import Button from "$lib/components/ui/Button.svelte";
  import Textarea from "$lib/components/ui/Textarea.svelte";
  import { bskyPostUrl } from "$lib/utils.js";

  interface Props {
    koeUri: string;
    questionBody?: string;
    pageUrl?: string;
    onSuccess?: (answerUri: string, answerBody: string) => void;
  }

  let { koeUri, questionBody, pageUrl, onSuccess }: Props = $props();

  type FormState = "idle" | "submitting" | "success" | "error";

  const MAX_CHARS = 1000;
  const CROSSPOST_KEY = "mado:crosspost";

  function lastCrosspost(): boolean {
    try {
      return localStorage.getItem(CROSSPOST_KEY) === "1";
    } catch {
      return false;
    }
  }

  function rememberCrosspost(value: boolean) {
    try {
      localStorage.setItem(CROSSPOST_KEY, value ? "1" : "0");
    } catch {
      return;
    }
  }

  let body = $state("");
  let crosspost = $state(false);
  let formState = $state<FormState>("idle");
  let errorMsg = $state("");
  let crosspostFailed = $state(false);
  let crosspostLink = $state<string | null>(null);

  onMount(() => {
    crosspost = lastCrosspost();
  });

  function reset() {
    body = "";
    crosspost = lastCrosspost();
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
    const sent = body.trim();

    try {
      const res = await fetch("/api/answers/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ koeUri, body: sent, crosspost, pageUrl, questionBody }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { message?: string };
        throw new Error(data.message ?? "返信の投稿に失敗しました");
      }

      const data = await res.json() as {
        uri: string;
        crossposted?: boolean;
        crosspostUri?: string | null;
      };
      crosspostFailed = crosspost && data.crossposted === false;
      crosspostLink = data.crosspostUri ? bskyPostUrl(data.crosspostUri) : null;
      rememberCrosspost(crosspost);
      formState = "success";
      onSuccess?.(data.uri, sent);
    } catch (err) {
      formState = "error";
      errorMsg = err instanceof Error ? err.message : "返信の投稿に失敗しました";
    }
  }
</script>

{#if formState === "success"}
  <div data-suisou-item="notice" data-suisou-layout="stack center" data-suisou-text="center" data-suisou="success p-4" role="status" class="done">
    <CheckCircle2 class="big" />
    <div data-suisou-layout="stack gap-1 center">
      <p data-suisou-text="fs-16 fw-700">返信を投稿しました</p>
      {#if crosspostFailed}
        <p data-suisou-layout="row" data-suisou-text="fs-14" data-suisou="warning">
          <AlertCircle />
          Blueskyへの転載は失敗しました
        </p>
      {:else if crosspostLink}
        <a
          data-suisou-layout="row"
          data-suisou-text="fs-14 link"
          href={crosspostLink}
          target="_blank"
          rel="noopener noreferrer"
        >
          <ExternalLink />
          Blueskyの投稿を見る
        </a>
      {/if}
    </div>
    <Button variant="ghost" onclick={reset}>続けて返信する</Button>
  </div>
{:else}
  <form onsubmit={handleSubmit} data-suisou-layout="stack gap-3" class="form">
    <Textarea
      label="返信"
      bind:value={body}
      maxlength={MAX_CHARS}
      showCount={true}
      rows={4}
      disabled={formState === "submitting"}
      error={body.length > MAX_CHARS ? `${MAX_CHARS}文字以内で入力してください` : undefined}
    />

    {#if formState === "error"}
      <p data-suisou-item="notice" data-suisou-layout="row" data-suisou="error" role="alert">
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
        <span data-suisou-text="fs-12" data-suisou="note">Bskyにもポスト</span>
      </label>
      <Button
        type="submit"
        loading={formState === "submitting"}
        disabled={!isValid}
      >
        {#snippet rightIcon()}<Send />{/snippet}
        返信を投稿
      </Button>
    </div>
  </form>
{/if}

<style>
  .check {
    cursor: pointer;
    user-select: none;
  }
  .done :global(.big) {
    width: 2.25rem;
    height: 2.25rem;
    color: var(--suisou-color-success);
  }
</style>
