<script lang="ts">
  import type { HTMLTextareaAttributes } from "svelte/elements";
  import { Textarea as ShadcnTextarea } from "$lib/components/ui/textarea";
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

  // Unique, hydration-stable fallback id (avoids duplicate ids when two fields
  // share a label — that breaks label/for association and focus).
  const uid = $props.id();
  const inputId = $derived(id ?? (label ? `${uid}-textarea` : undefined));
  const charCount = $derived(typeof value === "string" ? value.length : 0);
  const isNearLimit = $derived(maxlength ? charCount > (maxlength as number) * 0.8 : false);
  const isOverLimit = $derived(maxlength ? charCount > (maxlength as number) : false);
</script>

<div class="flex flex-col gap-1.5 w-full">
  <div class="flex items-center justify-between">
    {#if label}
      <label for={inputId} class="text-sm font-medium text-muted-foreground">{label}</label>
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
  <ShadcnTextarea
    id={inputId}
    bind:value
    maxlength={maxlength}
    class={cn(
      "px-4 py-3 min-h-[120px] resize-y",
      error && "border-destructive/60 focus-visible:ring-destructive/40",
      className
    )}
    aria-invalid={error ? true : undefined}
    {...restProps}
  />
  {#if error}
    <p class="text-xs text-error">{error}</p>
  {:else if helper}
    <p class="text-xs text-subtle">{helper}</p>
  {/if}
</div>
