<script lang="ts">
  import type { HTMLTextareaAttributes } from "svelte/elements";
  import { cn } from "$lib/utils.js";

  interface Props extends Omit<HTMLTextareaAttributes, "class"> {
    label?: string;
    error?: string;
    helper?: string;
    showCount?: boolean;
    class?: string;
  }

  let {
    label,
    error,
    helper,
    showCount = false,
    class: className = "",
    id,
    maxlength,
    value = $bindable(""),
    ...restProps
  }: Props = $props();

  const inputId = $derived(id ?? (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined));
  const charCount = $derived(typeof value === "string" ? value.length : 0);
  const isNearLimit = $derived(maxlength ? charCount > (maxlength as number) * 0.8 : false);
  const isOverLimit = $derived(maxlength ? charCount > (maxlength as number) : false);
</script>

<div class="flex flex-col gap-1.5 w-full">
  <div class="flex items-center justify-between">
    {#if label}
      <label for={inputId} class="text-sm font-medium text-muted">{label}</label>
    {:else}
      <span></span>
    {/if}
    {#if showCount || maxlength}
      <span
        class={cn(
          "text-xs tabular-nums",
          isOverLimit ? "text-error" : isNearLimit ? "text-warning" : "text-subtle"
        )}
      >
        {charCount}{maxlength ? `/${maxlength}` : ""}
      </span>
    {/if}
  </div>
  <textarea
    id={inputId}
    bind:value
    maxlength={maxlength}
    class={cn(
      "w-full rounded-lg px-4 py-3 text-sm transition-all duration-200 resize-y",
      "focus:outline-none focus:ring-2 min-h-[120px]",
      "placeholder:opacity-50",
      "bg-elevated text-primary",
      error
        ? "border border-red-600/40 ring-1 ring-red-500/50 focus:ring-red-500/60"
        : "border border-border focus:ring-blue-500/40",
      className
    )}
    {...restProps}
  ></textarea>
  {#if error}
    <p class="text-xs text-error">{error}</p>
  {:else if helper}
    <p class="text-xs text-subtle">{helper}</p>
  {/if}
</div>
