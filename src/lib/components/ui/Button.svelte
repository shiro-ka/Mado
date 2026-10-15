<script lang="ts" module>
  import type { HTMLAnchorAttributes, HTMLButtonAttributes } from "svelte/elements";
  import type { WithElementRef } from "$lib/utils.js";

  export type ButtonVariant = "default" | "outline" | "secondary" | "ghost" | "destructive";

  const VARIANT_MAP: Record<ButtonVariant, [string, string]> = {
    default: ["outline", "accent"],
    outline: ["outline", ""],
    secondary: ["outline", ""],
    ghost: ["", ""],
    destructive: ["outline", "error"],
  };

  export type ButtonProps = WithElementRef<HTMLButtonAttributes> &
    WithElementRef<HTMLAnchorAttributes> & {
      variant?: ButtonVariant;
      icon?: boolean;
      wide?: boolean;
      loading?: boolean;
      leftIcon?: import("svelte").Snippet;
      rightIcon?: import("svelte").Snippet;
    };
</script>

<script lang="ts">
  let {
    class: className,
    variant = "default",
    icon = false,
    wide = false,
    ref = $bindable(null),
    href = undefined,
    type = "button",
    disabled,
    loading = false,
    leftIcon,
    rightIcon,
    children,
    ...restProps
  }: ButtonProps = $props();

  const isDisabled = $derived(disabled || loading);
  const suisou = $derived([VARIANT_MAP[variant][0], icon ? "icon" : ""].filter(Boolean).join(" "));
  const tone = $derived([VARIANT_MAP[variant][1], wide ? "w-full" : ""].filter(Boolean).join(" ") || undefined);
</script>

{#if href}
  <a
    bind:this={ref}
    data-suisou-button={suisou}
    data-suisou={tone}
    class={className}
    href={isDisabled ? undefined : href}
    aria-disabled={isDisabled}
    role={isDisabled ? "link" : undefined}
    tabindex={isDisabled ? -1 : undefined}
    {...restProps}
  >
    {#if loading}
      <progress data-suisou-loading="small" aria-label="処理中"></progress>
    {:else if leftIcon}
      {@render leftIcon()}
    {/if}
    {@render children?.()}
    {#if !loading && rightIcon}
      {@render rightIcon()}
    {/if}
  </a>
{:else}
  <button
    bind:this={ref}
    data-suisou-button={suisou}
    data-suisou={tone}
    class={className}
    {type}
    disabled={isDisabled}
    {...restProps}
  >
    {#if loading}
      <progress data-suisou-loading="small" aria-label="処理中"></progress>
    {:else if leftIcon}
      {@render leftIcon()}
    {/if}
    {@render children?.()}
    {#if !loading && rightIcon}
      {@render rightIcon()}
    {/if}
  </button>
{/if}
