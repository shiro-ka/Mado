<script lang="ts">
  import type { Snippet } from "svelte";

  /* アイコンを載せる角丸のタイル。

     ★Suisou に語彙が無い（avatar は円＝「人・主体」で、こちらはモノを指す角丸）。
       Mado の中で **4現場**が同じものを手書きしていた ―― Madoについて の特徴3枚 /
       使い方 の手順 / ランディングの特徴・手順 / 窓カードの先頭。
       Suisou の3回ルールに乗るので、還元候補（dev/todo/mado-suisou-ui.md）。

     ★色は持たない。中の svg に data-suisou-icon="accent" などを書く ――
       色を決めるのは Suisou（solve.py）だけ、という掟1 に合わせて、
       ここに tone プロップという穴を開けない。

     面は surface="item"、中央寄せは layout="center"。この部品が足すのは
     「正方形であること」と「余白を持たないこと」だけ。 */

  interface Props {
    /** 一回り小さいタイル（一覧の行の先頭など）。 */
    small?: boolean;
    children: Snippet;
  }

  let { small = false, children }: Props = $props();
</script>

<span data-suisou-surface="item" data-suisou-layout="center" class="tile" class:small>
  {@render children()}
</span>

<style>
  .tile {
    flex: none;
    width: 2.25rem;
    height: 2.25rem;
    padding: 0;
  }
  .tile.small {
    width: 1.75rem;
    height: 1.75rem;
  }
</style>
