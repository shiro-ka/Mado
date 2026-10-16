<script lang="ts">
  import { goto, invalidateAll } from "$app/navigation";
  import { Plus, AlertCircle } from "lucide-svelte";
  import Button from "$lib/components/ui/Button.svelte";
  import Input from "$lib/components/ui/Input.svelte";
  import Textarea from "$lib/components/ui/Textarea.svelte";
  import Toggle from "$lib/components/ui/Toggle.svelte";
  import { slugFormatError } from "$lib/validation.js";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  type FormState = "idle" | "submitting" | "error";

  let title = $state("");
  let description = $state("");
  let slug = $state("");
  let isOpen = $state(true);
  let formState = $state<FormState>("idle");
  let errorMsg = $state("");

  const slugPreview = $derived(slug.trim().toLowerCase() || "（自動生成）");
  const slugErr = $derived(slugFormatError(slug));

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    if (!title.trim() || slugErr || formState === "submitting") return;

    formState = "submitting";
    errorMsg = "";

    try {
      const res = await fetch("/api/boxes/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          slug: slug.trim() || undefined,
          isOpen,
        }),
      });

      const json = (await res.json()) as { rkey?: string; error?: string; message?: string };

      if (!res.ok) {
        throw new Error(json.message ?? json.error ?? "作成に失敗しました");
      }

      await goto(`/@${data.cleanHandle}`);
      await invalidateAll();
    } catch (err) {
      formState = "error";
      errorMsg = err instanceof Error ? err.message : "作成に失敗しました";
    }
  }
</script>

<svelte:head>
  <title>窓を開ける | Mado</title>
</svelte:head>

<div data-suisou-layout="stack gap-4" data-suisou="container" class="page">
  <h1 data-suisou-text="fs-24 fw-700" class="heading">窓を開ける</h1>

  <div data-suisou-tray class="card">
    <form onsubmit={handleSubmit} data-suisou-layout="stack gap-4" class="form">
      <Input
        label="窓の名前"
        bind:value={title}
        maxlength={100}
        required
        disabled={formState === "submitting"}
      />

      <Textarea
        label="窓の説明"
        bind:value={description}
        maxlength={300}
        showCount
        rows={4}
        disabled={formState === "submitting"}
      />

      <div data-suisou-layout="stack gap-1" class="slug">
        <Input
          label="URL"
          bind:value={slug}
          error={slugErr ?? undefined}
          helper="英小文字・数字・ハイフンのみ。空欄なら自動生成されます。あとから変更もできます。"
          maxlength={30}
          disabled={formState === "submitting"}
        />
        <p data-suisou-text="fs-12" class="preview">
          /@{data.cleanHandle}/<span class="accent">{slugPreview}</span>
        </p>
      </div>

      <div data-suisou-layout="row between">
        <div data-suisou-layout="stack gap-0" class="label">
          <p data-suisou-text="fs-14 fw-500" class="sub">声の受付</p>
          <p data-suisou-text="fs-12" class="sub">オフにすると新しい声を受け付けません</p>
        </div>
        <Toggle bind:checked={isOpen} label="声の受付" disabled={formState === "submitting"} />
      </div>

      {#if errorMsg}
        <p data-suisou-item="notice" data-suisou-layout="row" data-suisou="error" role="alert">
          <AlertCircle data-suisou-text="fs-16" />
          {errorMsg}
        </p>
      {/if}

      <div data-suisou-layout="row end">
        <Button variant="outline" href={`/@${data.cleanHandle}`} disabled={formState === "submitting"}>キャンセル</Button>
        <Button
          type="submit"
          loading={formState === "submitting"}
          disabled={!title.trim() || !!slugErr}
        >
          {#snippet leftIcon()}<Plus />{/snippet}
          作成する
        </Button>
      </div>
    </form>
  </div>
</div>

<style>
  .page {
    max-width: 42rem;
    padding: var(--suisou-space-4) var(--suisou-space-3);
  }
  .heading {
    cursor: default;
    user-select: none;
  }
  .card {
    padding: var(--suisou-space-4);
  }
  .preview {
    font-family: var(--suisou-font-mono);
    color: var(--suisou-color-text-sub);
    word-break: break-all;
  }
  .accent {
    color: var(--suisou-color-accent);
  }
  .sub {
    color: var(--suisou-color-text-sub);
  }
</style>
