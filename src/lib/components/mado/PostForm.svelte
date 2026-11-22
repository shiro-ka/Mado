<script lang="ts">
  import type { Snippet } from "svelte";
  import { Send, AlertCircle, CheckCircle2 } from "lucide-svelte";
  import Button from "$lib/components/ui/Button.svelte";
  import Textarea from "$lib/components/ui/Textarea.svelte";
  import { POST_MAX_GRAPHEMES, POST_MAX_BYTES, fitsLimit } from "$lib/text.js";

  interface Props {
    label: string;
    rows: number;
    helper?: string;
    submitLabel: string;
    failMessage: string;
    successTitle: string;
    againLabel: string;
    submit: (body: string) => Promise<void>;
    onReset?: () => void;
    successDetail?: Snippet;
    options?: Snippet<[boolean]>;
  }

  let {
    label,
    rows,
    helper,
    submitLabel,
    failMessage,
    successTitle,
    againLabel,
    submit,
    onReset,
    successDetail,
    options,
  }: Props = $props();

  let body = $state("");
  let formState = $state<"idle" | "submitting" | "success" | "error">("idle");
  let errorMsg = $state("");

  const fits = $derived(fitsLimit(body, POST_MAX_GRAPHEMES, POST_MAX_BYTES));
  const isValid = $derived(body.trim().length > 0 && fits);

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    if (!isValid || formState === "submitting") return;
    formState = "submitting";
    errorMsg = "";
    try {
      await submit(body.trim());
      formState = "success";
    } catch (err) {
      formState = "error";
      errorMsg = err instanceof Error ? err.message : failMessage;
    }
  }

  function reset() {
    body = "";
    errorMsg = "";
    formState = "idle";
    onReset?.();
  }
</script>

{#if formState === "success"}
  <div data-suisou-item="notice" data-suisou-layout="stack center" data-suisou-text="center" data-suisou="success p-4" role="status">
    <CheckCircle2 data-suisou-text="fs-32" data-suisou="success" />
    <div data-suisou-layout="stack gap-1 center">
      <p data-suisou-text="fs-16 fw-700">{successTitle}</p>
      {@render successDetail?.()}
    </div>
    <Button variant="ghost" onclick={reset}>{againLabel}</Button>
  </div>
{:else}
  <form onsubmit={handleSubmit} data-suisou-layout="stack gap-3">
    <Textarea
      {label}
      bind:value={body}
      maxGraphemes={POST_MAX_GRAPHEMES}
      showCount={true}
      {rows}
      {helper}
      disabled={formState === "submitting"}
      error={fits ? undefined : `${POST_MAX_GRAPHEMES}文字以内で入力してください`}
    />

    {#if formState === "error"}
      <p data-suisou-item="notice" data-suisou-layout="row" data-suisou="error" role="alert">
        <AlertCircle data-suisou-text="fs-16" />
        {errorMsg}
      </p>
    {/if}

    <div data-suisou-layout={options ? "row between wrap" : "row end"}>
      {@render options?.(formState === "submitting")}
      <Button type="submit" loading={formState === "submitting"} disabled={!isValid}>
        {#snippet rightIcon()}<Send />{/snippet}
        {submitLabel}
      </Button>
    </div>
  </form>
{/if}
