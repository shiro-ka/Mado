<script lang="ts">
  import { profilePath } from "$lib/urls.js";
  import { createBox } from "$lib/api.js";
  import { goto, invalidateAll } from "$app/navigation";
  import { Plus, AlertCircle } from "lucide-svelte";
  import Button from "$lib/components/ui/Button.svelte";
  import BoxFields, { boxFieldsReady, boxFieldsValue } from "$lib/components/mado/BoxFields.svelte";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  let fields = $state({ title: "", description: "", slug: "" });
  let submitting = $state(false);
  let errorMsg = $state("");

  const ready = $derived(boxFieldsReady(fields));

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    if (!ready || submitting) return;
    submitting = true;
    errorMsg = "";
    try {
      await createBox(boxFieldsValue(fields));
      await goto(profilePath(data.cleanHandle));
      await invalidateAll();
    } catch (err) {
      errorMsg = err instanceof Error ? err.message : "作成に失敗しました";
    } finally {
      submitting = false;
    }
  }
</script>

<svelte:head>
  <title>窓を開ける | Mado</title>
</svelte:head>

<div data-suisou-layout="stack gap-4" data-suisou="container-s py-4 px-3">
  <h1 data-suisou-text="fs-24 fw-700" class="heading">窓を開ける</h1>

  <div data-suisou-tray data-suisou="p-4">
    <form onsubmit={handleSubmit} data-suisou-layout="stack gap-4" class="form">
      <BoxFields
        bind:title={fields.title}
        bind:description={fields.description}
        bind:slug={fields.slug}
        cleanHandle={data.cleanHandle}
        slugFallback="(空欄だと自動で決まるよ)"
        disabled={submitting}
      />

      {#if errorMsg}
        <p data-suisou-item="notice" data-suisou-layout="row" data-suisou="error" role="alert">
          <AlertCircle data-suisou-text="fs-16" />
          {errorMsg}
        </p>
      {/if}

      <div data-suisou-layout="row end">
        <Button variant="outline" href={profilePath(data.cleanHandle)} disabled={submitting}>キャンセル</Button>
        <Button
          type="submit"
          loading={submitting}
          disabled={!ready}
        >
          {#snippet leftIcon()}<Plus />{/snippet}
          作成する
        </Button>
      </div>
    </form>
  </div>
</div>

<style>
  .heading {
    cursor: default;
    user-select: none;
  }
</style>
