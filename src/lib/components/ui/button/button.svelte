<script lang="ts" module>
	import type { HTMLAnchorAttributes, HTMLButtonAttributes } from "svelte/elements";
	import type { WithElementRef } from "$lib/utils.js";

	/* Suisou の Button に乗せ替えた（2026-08-22）。API は変えていないので
	   15 ファイル 33 箇所の呼び出しは無修正で追従する（wixdex の BaseModal と同じ手）。

	   variant の対応 ―― Suisou は塗らない（線形デザイン）ので:
	     default     → outline   目的の一本。塗りの CTA はアクセント色の枠に
	     secondary   → plain     罫だけで立つ
	     outline     → plain
	     ghost       → 基本形     幽霊。hover で下地
	     destructive → danger
	     link        → 基本形 + data-suisou-link の下線は持たない（ボタンは線を引かない）

	   size は Suisou が1段しか持たないので**受けるが無視する**。
	   高さの3段（h-6/h-7/h-8）は Tailwind の名残で、詰めの差は余白の段が吸う。
	   まず1段で全画面を見て、本当に困る場所が3回出たら Suisou 側に相談する。 */
	export type ButtonVariant = "default" | "outline" | "secondary" | "ghost" | "destructive" | "link";
	export type ButtonSize = "default" | "xs" | "sm" | "lg" | "icon" | "icon-xs" | "icon-sm" | "icon-lg";

	const VARIANT_MAP: Record<ButtonVariant, string> = {
		default: "outline",
		outline: "plain",
		secondary: "plain",
		ghost: "",
		destructive: "danger",
		link: "",
	};

	export type ButtonProps = WithElementRef<HTMLButtonAttributes> &
		WithElementRef<HTMLAnchorAttributes> & {
			variant?: ButtonVariant;
			size?: ButtonSize;
			loading?: boolean;
			leftIcon?: import("svelte").Snippet;
			rightIcon?: import("svelte").Snippet;
		};
</script>

<script lang="ts">
	let {
		class: className,
		variant = "default",
		size = "default",
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
		[VARIANT_MAP[variant], size.startsWith("icon") ? "icon" : ""].filter(Boolean).join(" "),
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
			<!-- 読み込み中は Suisou の Spinner。lucide の回転アイコンより意味が乗る -->
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
