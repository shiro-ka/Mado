<script lang="ts">
  interface Props {
    height?: string;
  }

  let { height = "1rem" }: Props = $props();
</script>

<div class="skeleton" style:--h={height}></div>

<style>
  .skeleton {
    height: var(--h);
    border-radius: var(--suisou-radius);
    background: var(--suisou-color-item);
    animation: skeleton-pulse 1.6s ease-in-out infinite;
  }

  @keyframes skeleton-pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.45;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .skeleton {
      animation: none;
    }
  }
</style>
