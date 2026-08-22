<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLInputAttributes } from "svelte/elements";
  import { cn } from "$lib/utils.js";

  interface Props extends Omit<HTMLInputAttributes, "class"> {
    label?: string;
    error?: string;
    helper?: string;
    class?: string;
    leftAddon?: Snippet;
    rightAddon?: Snippet;
  }

  let {
    label,
    error,
    helper,
    class: className = "",
    leftAddon,
    rightAddon,
    id,
    value = $bindable(""),
    ...restProps
  }: Props = $props();

  // Unique, hydration-stable fallback id. Deriving from the label text (as
  // before) produced duplicate ids when two fields shared a label, breaking
  // label/for association and focus.
  const uid = $props.id();
  const inputId = $derived(id ?? (label ? `${uid}-input` : undefined));
</script>

<div class="flex flex-col gap-1.5 w-full">
  {#if label}
    <label for={inputId} class="text-sm font-medium text-muted-foreground">{label}</label>
  {/if}
  <div class="relative flex items-center">
    {#if leftAddon}
      <div class="absolute left-3 flex items-center pointer-events-none text-subtle">
        {@render leftAddon()}
      </div>
    {/if}
    <!-- 枠・下地・焦点の輪・invalid の赤枠は Suisou の field が持つ。
         残っているのは addon ぶんの逃げ（padding）だけ -->
    <input
      id={inputId}
      bind:value
      data-suisou-field="block"
      class={cn(leftAddon && "pl-10", rightAddon && "pr-10", className)}
      aria-invalid={error ? true : undefined}
      {...restProps}
    />
    {#if rightAddon}
      <div class="absolute right-3 flex items-center text-subtle">
        {@render rightAddon()}
      </div>
    {/if}
  </div>
  {#if error}
    <p class="text-xs text-error">{error}</p>
  {:else if helper}
    <p class="text-xs text-subtle">{helper}</p>
  {/if}
</div>
