<script lang="ts">
  import type { HTMLTextareaAttributes } from "svelte/elements";


  interface Props extends Omit<HTMLTextareaAttributes, "class"> {
    label?: string;
    error?: string;
    helper?: string;
    showCount?: boolean;
  }

  let {
    label,
    error,
    helper,
    showCount = false,
    id,
    maxlength,
    value = $bindable(""),
    ...restProps
  }: Props = $props();

  const uid = $props.id();
  const inputId = $derived(id ?? (label ? `${uid}-textarea` : undefined));
  const charCount = $derived(typeof value === "string" ? value.length : 0);
  const isNearLimit = $derived(maxlength ? charCount > (maxlength as number) * 0.8 : false);
  const isOverLimit = $derived(maxlength ? charCount > (maxlength as number) : false);
</script>

<div data-suisou-layout="stack">
  {#if label || showCount || maxlength}
    <div data-suisou-layout="row between">
      {#if label}
        <label for={inputId} data-suisou-text="fs-14 fw-500" class="label">{label}</label>
      {:else}
        <span></span>
      {/if}
      {#if showCount || maxlength}
        <span
          data-suisou-text="fs-12"
          class="count"
          class:over={isOverLimit}
          class:near={!isOverLimit && isNearLimit}
        >
          {charCount}{maxlength ? `/${maxlength}` : ""}
        </span>
      {/if}
    </div>
  {/if}

  <textarea
    data-suisou="w-full"
    id={inputId}
    bind:value
    {maxlength}
    aria-invalid={error ? "true" : undefined}
    {...restProps}
  ></textarea>

  {#if error}
    <p data-suisou-text="fs-12" class="error">{error}</p>
  {:else if helper}
    <p data-suisou-text="fs-12" class="helper">{helper}</p>
  {/if}
</div>

<style>
  .label,
  .count {
    color: var(--suisou-color-text-sub);
  }
  .count.near {
    color: var(--suisou-color-warning);
  }
  .count.over,
  .error {
    color: var(--suisou-color-error);
  }
  .helper {
    color: var(--suisou-color-text-sub);
  }
  textarea {
    min-height: 120px;
    resize: vertical;
  }
</style>
