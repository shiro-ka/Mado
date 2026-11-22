<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";
  import BlueskyIcon from "$lib/components/ui/BlueskyIcon.svelte";

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, "class"> {
    handle: string;
    displayName?: string;
    avatar?: string;
    children?: Snippet;
  }

  let { handle, displayName, avatar, children, ...rest }: Props = $props();
</script>

<div data-suisou-item="media" class="owner" {...rest}>
  {#if avatar}
    <img data-suisou-item="circle large media-figure" src={avatar} alt="" />
  {:else}
    <div data-suisou-item="circle large media-figure">{handle[0]?.toUpperCase() ?? "?"}</div>
  {/if}
  <div data-suisou-item="media-content">
    <p data-suisou-text="fs-14 fw-700">{displayName || `@${handle}`}</p>
    <a
      data-suisou-layout="row"
      data-suisou-text="fs-12 link"
      data-suisou="accent"
      href={`https://bsky.app/profile/${handle}`}
      target="_blank"
      rel="noopener noreferrer"
    >
      <BlueskyIcon data-suisou-text="fs-16" />
      @{handle}
    </a>
    {@render children?.()}
  </div>
</div>

<style>
  .owner {
    align-items: center;
  }
</style>
