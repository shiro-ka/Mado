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
    width: var(--suisou-size-icon);
    height: var(--suisou-size-icon);
    cursor: pointer;
  }
  .switch:disabled {
    cursor: default;
  }
</style>
