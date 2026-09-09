<script lang="ts" module>
  import type { HTMLAnchorAttributes, HTMLButtonAttributes } from "svelte/elements";
  import type { WithElementRef } from "$lib/utils.js";

  /* Suisou の Button に乗せる薄い層。
     variant の対応 ―― Suisou は塗らない（線形デザイン）ので:
       default     → outline   目的の一本。塗りの CTA はアクセント色の枠に
       secondary   → plain     罫だけで立つ
       outline     → plain
       ghost       → 基本形     幽霊。hover で下地
       destructive → danger

     ★大きさの段は持たない。Suisou の Button は1段しかなく、詰めの差は
       余白の段が吸う。本当に困る場所が3回出たら Suisou 側に相談する。 */
  export type ButtonVariant = "default" | "outline" | "secondary" | "ghost" | "destructive";

  const VARIANT_MAP: Record<ButtonVariant, string> = {
    default: "outline",
    outline: "plain",
    secondary: "plain",
    ghost: "",
    destructive: "danger",
  };

  export type ButtonProps = WithElementRef<HTMLButtonAttributes> &
    WithElementRef<HTMLAnchorAttributes> & {
      variant?: ButtonVariant;
      /** アイコン1つだけの正方形のボタン。Suisou の button="icon" */
      icon?: boolean;
      /** 全幅の CTA。Suisou の button="wide" */
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
  const suisou = $derived(
    [VARIANT_MAP[variant], icon ? "icon" : "", wide ? "wide" : ""].filter(Boolean).join(" "),
  );
</script>

{#if href}
  <a
    bind:this={ref}
    data-suisou-button={suisou}
    class={className}
    href={isDisabled ? undefined : href}
    aria-disabled={isDisabled}
    role={isDisabled ? "link" : undefined}
    tabindex={isDisabled ? -1 : undefined}
    {...restProps}
  >
    {#if loading}
      <!-- 読み込み中は Suisou の Spinner。回転アイコンより意味が乗る -->
      <span data-suisou-spinner role="status" aria-label="処理中"></span>
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
    class={className}
    {type}
    disabled={isDisabled}
    {...restProps}
  >
    {#if loading}
      <span data-suisou-spinner role="status" aria-label="処理中"></span>
    {:else if leftIcon}
      {@render leftIcon()}
    {/if}
    {@render children?.()}
    {#if !loading && rightIcon}
      {@render rightIcon()}
    {/if}
  </button>
{/if}
