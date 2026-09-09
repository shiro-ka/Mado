<script lang="ts">
  /* 読み込み中の板。★Suisou に語彙が無い部品（spinner はあるが、
     こちらは「出来上がる場所を先に取っておく」もので役目が違う）。

     ★寸法は class ではなくプロップで受ける。外から素の class を渡す作りにしない。

     ★動きを減らす設定では明滅を止める。Suisou の spinner が --suisou-motion 系を
       使わない理由と同じ ―― 無限に繰り返す動きを 0.01ms に潰すと高速の明滅になり、
       配慮が一番危険なものに変わる。 */

  interface Props {
    /** 高さ。CSS の長さをそのまま渡す（"13rem" など）。 */
    height?: string;
    /** 広い画面（768px 以上）での高さ。省略すると height のまま。 */
    heightWide?: string;
  }

  let { height = "1rem", heightWide }: Props = $props();
</script>

<div class="skeleton" style:--h={height} style:--h-wide={heightWide ?? height}></div>

<style>
  .skeleton {
    height: var(--h);
    border-radius: var(--suisou-radius);
    background: var(--suisou-item);
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
