<script lang="ts" module>
  import { BOX_TITLE_MAX_LENGTH, BOX_DESCRIPTION_MAX_GRAPHEMES, BOX_DESCRIPTION_MAX_BYTES, fitsLimit } from "$lib/text.js";
  import { slugFormatError, SLUG_MAX_LENGTH } from "$lib/validation.js";

  export function boxFieldsReady(f: { title: string; description: string; slug: string }) {
    return (
      f.title.trim().length > 0 &&
      !slugFormatError(f.slug) &&
      fitsLimit(f.description, BOX_DESCRIPTION_MAX_GRAPHEMES, BOX_DESCRIPTION_MAX_BYTES)
    );
  }

  export function boxFieldsValue(f: { title: string; description: string; slug: string }) {
    return {
      title: f.title.trim(),
      description: f.description.trim() || undefined,
      slug: f.slug.trim().toLowerCase() || undefined,
    };
  }
</script>

<script lang="ts">
  import Input from "$lib/components/ui/Input.svelte";
  import Textarea from "$lib/components/ui/Textarea.svelte";

  interface Props {
    title: string;
    description: string;
    slug: string;
    cleanHandle: string;
    slugFallback: string;
    slugHelper?: string;
    disabled?: boolean;
  }

  let {
    title = $bindable(),
    description = $bindable(),
    slug = $bindable(),
    cleanHandle,
    slugFallback,
    slugHelper,
    disabled = false,
  }: Props = $props();
</script>

<Input label="窓の名前" bind:value={title} maxlength={BOX_TITLE_MAX_LENGTH} required {disabled} />

<Textarea
  label="窓の説明"
  bind:value={description}
  maxGraphemes={BOX_DESCRIPTION_MAX_GRAPHEMES}
  showCount
  rows={4}
  {disabled}
/>

<div data-suisou-layout="stack gap-1">
  <Input
    label="URL"
    bind:value={slug}
    error={slugFormatError(slug) ?? undefined}
    helper={slugHelper}
    maxlength={SLUG_MAX_LENGTH}
    {disabled}
  />
  <p data-suisou-text="fs-12" data-suisou="note">
    <code>/@{cleanHandle}/<span data-suisou="accent">{slug.trim().toLowerCase() || slugFallback}</span></code>
  </p>
</div>
