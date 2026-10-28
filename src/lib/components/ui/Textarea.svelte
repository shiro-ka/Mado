<script lang="ts">
  import type { HTMLTextareaAttributes } from "svelte/elements";
  import { graphemeLength } from "$lib/text.js";


  interface Props extends Omit<HTMLTextareaAttributes, "class"> {
    label?: string;
    error?: string;
    helper?: string;
    showCount?: boolean;
    maxGraphemes?: number;
  }

  let {
    label,
    error,
    helper,
    showCount = false,
    id,
    maxGraphemes,
    value = $bindable(""),
    ...restProps
  }: Props = $props();

  const uid = $props.id();
  const inputId = $derived(id ?? (label ? `${uid}-textarea` : undefined));
  const charCount = $derived(typeof value === "string" ? graphemeLength(value) : 0);
  const isNearLimit = $derived(maxGraphemes ? charCount > maxGraphemes * 0.8 : false);
  const isOverLimit = $derived(maxGraphemes ? charCount > maxGraphemes : false);
</script>

<div data-suisou-layout="stack">
  {#if label || showCount || maxGraphemes}
    <div data-suisou-layout="row between">
      {#if label}
        <label for={inputId} data-suisou-text="fs-14 fw-500" class="label">{label}</label>
      {:else}
        <span></span>
      {/if}
      {#if showCount || maxGraphemes}
        <span
          data-suisou-text="fs-12"
          class="count"
          class:over={isOverLimit}
          class:near={!isOverLimit && isNearLimit}
        >
          {charCount}{maxGraphemes ? `/${maxGraphemes}` : ""}
        </span>
      {/if}
    </div>
  {/if}

  <textarea
    data-suisou="w-full"
    id={inputId}
    bind:value
    aria-invalid={error ? "true" : undefined}
    {...restProps}
  ></textarea>

  {#if error}
    <p data-suisou-text="fs-12" class="error">{error}</p>
  {:else if helper}
    <p data-suisou-text="fs-12" data-suisou="note">{helper}</p>
  {/if}
</div>

<style>
  .label {
    color: var(--suisou-color-text);
  }
  .count {
    color: var(--suisou-color-text-note);
  }
  .count.near {
    color: var(--suisou-color-warning);
  }
  .count.over,
  .error {
    color: var(--suisou-color-error);
  }
  textarea {
    min-height: 120px;
    resize: vertical;
  }
</style>
