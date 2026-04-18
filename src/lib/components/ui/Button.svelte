<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLButtonAttributes } from "svelte/elements";
  import { Loader2 } from "lucide-svelte";
  import { cn } from "$lib/utils.js";

  type ButtonVariant = "default" | "secondary" | "ghost" | "destructive" | "outline";
  type ButtonSize = "sm" | "md" | "lg";

  interface Props extends Omit<HTMLButtonAttributes, "class"> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    loading?: boolean;
    class?: string;
    leftIcon?: Snippet;
    rightIcon?: Snippet;
    children?: Snippet;
  }

  let {
    variant = "default",
    size = "md",
    loading = false,
    disabled = false,
    type = "button",
    class: className = "",
    leftIcon,
    rightIcon,
    children,
    ...restProps
  }: Props = $props();

  const variantClasses: Record<ButtonVariant, string> = {
    default:
      "bg-accent hover:bg-accent-hover text-white shadow-sm hover:shadow-blue-900/30 hover:shadow-md",
    secondary:
      "bg-blue-950/40 hover:bg-blue-950/60 text-blue-200 border border-blue-900/40 hover:border-blue-700/60",
    ghost: "bg-transparent hover:bg-blue-950/30 text-blue-300 hover:text-blue-200",
    destructive: "bg-red-600/90 hover:bg-red-600 text-white shadow-sm",
    outline:
      "bg-transparent border border-blue-700/40 hover:border-blue-600/60 text-blue-300 hover:text-blue-200 hover:bg-blue-950/20",
  };

  const sizeClasses: Record<ButtonSize, string> = {
    sm: "px-3 py-1.5 text-sm gap-1.5 rounded-md",
    md: "px-4 py-2 text-sm gap-2 rounded-lg",
    lg: "px-6 py-3 text-base gap-2.5 rounded-xl",
  };

  const isDisabled = $derived(disabled || loading);
</script>

<button
  {type}
  disabled={isDisabled}
  class={cn(
    "inline-flex items-center justify-center font-medium transition-all duration-200",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:ring-offset-1",
    "disabled:opacity-50 disabled:cursor-not-allowed",
    "select-none cursor-pointer",
    variantClasses[variant],
    sizeClasses[size],
    className
  )}
  {...restProps}
>
  {#if loading}
    <Loader2 class="animate-spin" size={16} />
  {:else if leftIcon}
    <span class="shrink-0">{@render leftIcon()}</span>
  {/if}
  {#if children}
    {@render children()}
  {/if}
  {#if !loading && rightIcon}
    <span class="shrink-0">{@render rightIcon()}</span>
  {/if}
</button>
