<script lang="ts" module>
	/* Suisou の Tag に乗せ替えた（2026-08-22）。API は据え置き。
	   Badge は「押せない分類のしるし」＝ Suisou でいう Tag そのもの。

	   variant の対応 ―― Suisou の Tag は塗らない（罫と文字色の閉じた集合）:
	     default          → accent
	     success          → success
	     warning          → warning
	     error/destructive → error
	     secondary/outline/ghost/muted → 中立（値なし）
	   size は Suisou が1段しか持たないので受けるが無視する。
	   dot は Tag の中の飾りとして残す（色は currentColor ―― variant に追従）。 */
	export type BadgeVariant =
		| "default" | "secondary" | "destructive" | "outline" | "ghost"
		| "success" | "warning" | "error" | "muted";
	export type BadgeSize = "sm" | "md";

	const VARIANT_MAP: Record<BadgeVariant, string> = {
		default: "accent",
		secondary: "",
		destructive: "error",
		outline: "",
		ghost: "bare",
		success: "success",
		warning: "warning",
		error: "error",
		muted: "",
	};
</script>

<script lang="ts">
	import type { HTMLAnchorAttributes } from "svelte/elements";
	import { type WithElementRef } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		href,
		class: className,
		variant = "default",
		size = "sm",
		dot = false,
		children,
		...restProps
	}: WithElementRef<HTMLAnchorAttributes> & {
		variant?: BadgeVariant;
		size?: BadgeSize;
		dot?: boolean;
	} = $props();
</script>

<svelte:element
	this={href ? "a" : "span"}
	bind:this={ref}
	data-suisou-tag={VARIANT_MAP[variant]}
	{href}
	class={className}
	{...restProps}
>
	{#if dot}
		<!-- 点の色は currentColor。variant の文字色にそのまま追従する -->
		<span class="dot"></span>
	{/if}
	{@render children?.()}
</svelte:element>

<style>
	.dot {
		display: inline-block;
		width: 6px;
		height: 6px;
		border-radius: 999px;
		background: currentColor;
		flex: none;
	}
</style>
