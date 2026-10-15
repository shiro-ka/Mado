<script lang="ts">
  import type { HTMLTextareaAttributes } from "svelte/elements";

  /* ラベル・文字数・エラーを連れた textarea。

     ★入力欄そのものは Suisou の field。shadcn の textarea ラッパ（ui/textarea/）を
       挟んでいたのをやめた ―― 同じ「入力欄」を2枚で持っていて、余白と罫が両方に
       書いてあった。ラッパごと削除。

     ★構造は data-suisou-layout に任せる。すきまは Suisou の間合い（8px）。 */

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

  // Unique, hydration-stable fallback id (avoids duplicate ids when two fields
  // share a label — that breaks label/for association and focus).
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
