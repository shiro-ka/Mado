<script lang="ts">
  interface Props {
    height?: string;
    heightWide?: string;
  }

  let { height = "1rem", heightWide }: Props = $props();
</script>

<div class="skeleton" style:--h={height} style:--h-wide={heightWide ?? height}></div>

<style>
  .skeleton {
    height: var(--h);
    border-radius: var(--suisou-radius);
    background: var(--suisou-color-item);
    animation: skeleton-pulse 1.6s ease-in-out infinite;
  }
  @media (width >= 768px) {
    .skeleton {
      height: var(--h-wide);
    }
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
