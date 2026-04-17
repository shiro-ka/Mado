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

  const inputId = $derived(id ?? (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined));
</script>

<div class="flex flex-col gap-1.5 w-full">
  {#if label}
    <label for={inputId} class="text-sm font-medium text-muted">{label}</label>
  {/if}
  <div class="relative flex items-center">
    {#if leftAddon}
      <div class="absolute left-3 flex items-center pointer-events-none text-subtle">
        {@render leftAddon()}
      </div>
    {/if}
    <input
      id={inputId}
      bind:value
      class={cn(
        "w-full rounded-lg px-4 py-3 text-sm transition-all duration-200",
        "focus:outline-none focus:ring-2",
        "placeholder:opacity-50",
        "bg-elevated text-primary",
        error
          ? "border border-red-600/40 ring-1 ring-red-500/50 focus:ring-red-500/60"
          : "border border-border focus:ring-blue-500/40",
        leftAddon && "pl-10",
        rightAddon && "pr-10",
        className
      )}
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
