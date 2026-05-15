<script lang="ts" module>
	import { type VariantProps, tv } from "tailwind-variants";

	export const badgeVariants = tv({
		base: "gap-1 rounded-full border border-transparent px-2 py-0.5 text-xs font-medium transition-all inline-flex w-fit shrink-0 items-center justify-center overflow-hidden whitespace-nowrap",
		variants: {
			variant: {
				default:     "bg-primary text-primary-foreground",
				secondary:   "bg-secondary text-secondary-foreground",
				destructive: "bg-destructive/10 text-destructive dark:bg-destructive/20",
				outline:     "border-border text-foreground",
				ghost:       "hover:bg-muted hover:text-muted-foreground",
				success:     "bg-emerald-400/10 text-emerald-400 border border-emerald-400/25",
				warning:     "bg-amber-400/10 text-amber-400 border border-amber-400/25",
				error:       "bg-red-400/10 text-red-400 border border-red-400/25",
				muted:       "bg-secondary text-muted-foreground border border-border",
			},
			size: {
				sm: "h-5 px-2 py-0.5 text-xs",
				md: "h-6 px-3 py-1 text-sm",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "sm",
		},
	});

	export type BadgeVariant = VariantProps<typeof badgeVariants>["variant"];
	export type BadgeSize   = VariantProps<typeof badgeVariants>["size"];
</script>

<script lang="ts">
	import type { HTMLAnchorAttributes } from "svelte/elements";
	import { cn, type WithElementRef } from "$lib/utils.js";

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

	const dotColor: Record<NonNullable<BadgeVariant>, string> = {
		default:     "bg-primary-foreground",
		secondary:   "bg-secondary-foreground",
		destructive: "bg-destructive",
		outline:     "bg-foreground",
		ghost:       "bg-muted-foreground",
		success:     "bg-emerald-400",
		warning:     "bg-amber-400",
		error:       "bg-red-400",
		muted:       "bg-muted-foreground",
	};
</script>

<svelte:element
	this={href ? "a" : "span"}
	bind:this={ref}
	data-slot="badge"
	{href}
	class={cn(badgeVariants({ variant, size }), className)}
	{...restProps}
>
	{#if dot}
		<span class={cn("inline-block w-1.5 h-1.5 rounded-full shrink-0", dotColor[variant ?? "default"])}></span>
	{/if}
	{@render children?.()}
</svelte:element>
