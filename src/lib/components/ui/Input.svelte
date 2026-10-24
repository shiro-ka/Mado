<script lang="ts">
  import type { HTMLInputAttributes } from "svelte/elements";


  interface Props extends Omit<HTMLInputAttributes, "class"> {
    label?: string;
    error?: string;
    helper?: string;
    prefix?: string;
  }

  let { label, error, helper, prefix, id, value = $bindable(""), ...restProps }: Props = $props();

  const uid = $props.id();
  const inputId = $derived(id ?? (label ? `${uid}-input` : undefined));
</script>

<div data-suisou-layout="stack">
  {#if label}
    <label for={inputId} data-suisou-text="fs-14 fw-500" class="label">{label}</label>
  {/if}

  {#if prefix}
    <div data-suisou-item="field">
      <span>{prefix}</span>
      <input
        id={inputId}
        bind:value
        aria-invalid={error ? "true" : undefined}
        {...restProps}
      />
    </div>
  {:else}
    <input
      data-suisou="w-full"
      id={inputId}
      bind:value
      aria-invalid={error ? "true" : undefined}
      {...restProps}
    />
  {/if}

  {#if error}
    <p data-suisou-text="fs-12" data-suisou="error">{error}</p>
  {:else if helper}
    <p data-suisou-text="fs-12" data-suisou="note">{helper}</p>
  {/if}
</div>

<style>
  .label {
    color: var(--suisou-color-text);
  }
</style>
