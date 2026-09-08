<script lang="ts">
  import type { HTMLInputAttributes } from "svelte/elements";

  /* ラベル・エラー・補足を連れた input。枠・下地・焦点の輪・invalid の赤枠は
     Suisou の field が持つ。

     ★leftAddon / rightAddon（Snippet を絶対配置で重ねて padding で逃げる仕組み）は捨てた。
       実測で rightAddon は 0 件、leftAddon は login の @ アイコン 1 件だけ。
       しかもそれは Suisou が語彙を持っている形 ―― button-group の中に affix
       （押せず書けない文字）を置く、URL の接頭辞と同じ idiom。
       任意の Snippet を重ねる穴より、文字列 1 つを受ける prefix の方が狭くて強い。 */

  interface Props extends Omit<HTMLInputAttributes, "class"> {
    label?: string;
    error?: string;
    helper?: string;
    /** 入力欄の手前に置く、押せず書けない文字（"@" など）。 */
    prefix?: string;
  }

  let { label, error, helper, prefix, id, value = $bindable(""), ...restProps }: Props = $props();

  // Unique, hydration-stable fallback id. Deriving from the label text (as
  // before) produced duplicate ids when two fields shared a label, breaking
  // label/for association and focus.
  const uid = $props.id();
  const inputId = $derived(id ?? (label ? `${uid}-input` : undefined));
</script>

<div data-suisou-layout="stack">
  {#if label}
    <label for={inputId} data-suisou-text="s14 w500" class="label">{label}</label>
  {/if}

  {#if prefix}
    <!-- ★even は「等分」の語だが、ここで欲しいのは幅いっぱい。button-group の既定が
         inline-flex なので、全幅にする語が even しか無くて借りている。
         Suisou 側に block か wide が要る。 -->
    <div data-suisou-button-group="even">
      <span data-suisou-affix>{prefix}</span>
      <input
        data-suisou-field
        id={inputId}
        bind:value
        aria-invalid={error ? "true" : undefined}
        {...restProps}
      />
    </div>
  {:else}
    <input
      data-suisou-field="block"
      id={inputId}
      bind:value
      aria-invalid={error ? "true" : undefined}
      {...restProps}
    />
  {/if}

  {#if error}
    <p data-suisou-text="s12" class="error">{error}</p>
  {:else if helper}
    <p data-suisou-text="s12" class="helper">{helper}</p>
  {/if}
</div>

<style>
  .label {
    color: var(--suisou-text-sub);
  }
  .error {
    color: var(--suisou-error);
  }
  .helper {
    color: var(--suisou-text-disabled);
  }
</style>
