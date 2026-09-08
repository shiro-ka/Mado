<script lang="ts">
  interface Props {
    checked?: boolean;
    disabled?: boolean;
    label?: string;
    onCheckedChange?: (checked: boolean) => void;
  }

  let {
    checked = $bindable(false),
    disabled = false,
    label,
    onCheckedChange,
  }: Props = $props();
</script>

<!-- 手製スイッチをやめてネイティブ checkbox に（2026-08-22）。
     Suisou はネイティブ部品を奪わない ―― accent-color が根にあるので
     色は勝手にテーマへ追従する。wixdex の公開トグルと同じ判断。
     role="switch" は checkbox に載せて意味を保つ。
     ★寸法だけは Suisou に語彙が無いので現場が持つ（アイコンと同じ 20px）。 -->
<input
  type="checkbox"
  role="switch"
  class="switch"
  aria-label={label}
  bind:checked
  onchange={() => onCheckedChange?.(checked)}
  {disabled}
/>

<style>
  .switch {
    flex: none;
    width: var(--suisou-icon);
    height: var(--suisou-icon);
    cursor: pointer;
  }
  .switch:disabled {
    cursor: default;
  }
</style>
