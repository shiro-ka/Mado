<script lang="ts">
  import { goto, invalidateAll } from "$app/navigation";
  import { ArrowLeft, Plus, AlertCircle } from "lucide-svelte";
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

  // Live preview of the box's public URL. Empty slug → auto-generated on save.
  const slugPreview = $derived(slug.trim().toLowerCase() || "（自動生成）");
  // Instant client-side format check (same rules as the server's slugSchema).
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
  <title>窓を作る | Mado</title>
</svelte:head>

<div data-suisou-layout="stack container gap-4" class="page">
  <div data-suisou-layout="row">
    <a href={`/@${data.cleanHandle}`}>
      <Button variant="ghost">
        {#snippet leftIcon()}<ArrowLeft />{/snippet}
        戻る
      </Button>
    </a>
    <h1 data-suisou-text="s24 w700">窓を作る</h1>
  </div>

  <div data-suisou-surface="panel" class="card">
    <form onsubmit={handleSubmit} data-suisou-layout="stack gap-4" class="form">
      <Input
        label="タイトル（必須）"
        placeholder="なんでも声を届けてください！"
        bind:value={title}
        helper="窓に表示されるタイトルです"
        maxlength={100}
        required
        disabled={formState === "submitting"}
      />

      <Textarea
        label="説明文"
        placeholder="どんな声でも歓迎です。匿名で送ってね。"
        bind:value={description}
        helper="任意。窓のページに表示される説明文です。"
        maxlength={300}
        showCount
        rows={4}
        disabled={formState === "submitting"}
      />

      <div data-suisou-layout="stack gap-1" class="slug">
        <Input
          label="URL（任意）"
          placeholder="ask"
          bind:value={slug}
          error={slugErr ?? undefined}
          helper="英小文字・数字・ハイフンのみ。空欄なら自動生成されます。あとから変更もできます。"
          maxlength={30}
          disabled={formState === "submitting"}
        />
        <p data-suisou-text="s12" class="preview">
          /@{data.cleanHandle}/<span class="accent">{slugPreview}</span>
        </p>
      </div>

      <div data-suisou-layout="row between">
        <div data-suisou-layout="stack gap-0" class="label">
          <p data-suisou-text="s14 w500" class="sub">声の受付</p>
          <p data-suisou-text="s12" class="sub">オフにすると新しい声を受け付けません</p>
        </div>
        <Toggle bind:checked={isOpen} label="声の受付" disabled={formState === "submitting"} />
      </div>

      {#if errorMsg}
        <p data-suisou-banner="error" data-suisou-layout="row" role="alert">
          <AlertCircle data-suisou-icon="small" />
          {errorMsg}
        </p>
      {/if}

      <div data-suisou-layout="row end">
        <a href={`/@${data.cleanHandle}`}>
          <Button type="button" disabled={formState === "submitting"}>キャンセル</Button>
        </a>
        <Button
          variant="outline"
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
    --suisou-measure: 42rem;
    padding: var(--suisou-space-4) var(--suisou-space-3);
  }
  .card {
    padding: var(--suisou-space-4);
  }
  .preview {
    font-family: var(--suisou-mono);
    color: var(--suisou-text-sub);
    word-break: break-all;
  }
  .accent {
    color: var(--suisou-accent);
  }
  .sub {
    color: var(--suisou-text-sub);
  }
</style>
