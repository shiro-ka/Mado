<script lang="ts">
  import { cn } from "$lib/utils.js";

  interface Props {
    checked?: boolean;
    disabled?: boolean;
    label?: string;
  }

  let { checked = $bindable(false), disabled = false, label }: Props = $props();
</script>

<button
  type="button"
  role="switch"
  aria-checked={checked}
  aria-label={label}
  onclick={() => (checked = !checked)}
  {disabled}
  class={cn(
    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200",
    "cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/40 border border-border",
    "disabled:cursor-not-allowed disabled:opacity-50",
    checked ? "bg-accent" : "bg-elevated"
  )}
>
  <span
    class="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200"
    style="transform: {checked ? 'translateX(22px)' : 'translateX(2px)'}"
  ></span>
</button>
