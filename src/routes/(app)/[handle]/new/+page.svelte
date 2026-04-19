<script lang="ts">
  import { goto, invalidateAll } from "$app/navigation";
  import { ArrowLeft, Plus, AlertCircle } from "lucide-svelte";
  import Button from "$lib/components/ui/Button.svelte";
  import Input from "$lib/components/ui/Input.svelte";
  import Textarea from "$lib/components/ui/Textarea.svelte";
  import Toggle from "$lib/components/ui/Toggle.svelte";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  type FormState = "idle" | "submitting" | "error";

  let title = $state("");
  let description = $state("");
  let isOpen = $state(true);
  let formState = $state<FormState>("idle");
  let errorMsg = $state("");

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    if (!title.trim() || formState === "submitting") return;

    formState = "submitting";
    errorMsg = "";

    try {
      const res = await fetch("/api/boxes/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
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
  <title>質問箱を作成 | Mado</title>
</svelte:head>

<div class="px-6 py-8 max-w-2xl mx-auto">
  <div class="flex items-center gap-3 mb-8">
    <a href={`/@${data.cleanHandle}`}>
      <Button variant="ghost" size="sm">
        {#snippet leftIcon()}<ArrowLeft size={15} />{/snippet}
        戻る
      </Button>
    </a>
    <h1 class="text-2xl font-bold text-primary">質問箱を作成</h1>
  </div>

  <div class="rounded-2xl p-8 bg-surface border border-border">
    <form onsubmit={handleSubmit} class="flex flex-col gap-6">
      <Input
        label="タイトル（必須）"
        placeholder="なんでも質問してください！"
        bind:value={title}
        helper="質問箱に表示されるタイトルです"
        maxlength={100}
        required
        disabled={formState === "submitting"}
      />

      <Textarea
        label="説明文"
        placeholder="どんな質問でも歓迎です。匿名で送ってね。"
        bind:value={description}
        helper="任意。質問箱のページに表示される説明文です。"
        maxlength={300}
        showCount
        rows={4}
        disabled={formState === "submitting"}
      />

      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-muted">質問の受付</p>
          <p class="text-xs mt-0.5 text-subtle">オフにすると新しい質問を受け付けません</p>
        </div>
        <Toggle bind:checked={isOpen} label="質問の受付" disabled={formState === "submitting"} />
      </div>

      {#if errorMsg}
        <div class="rounded-lg p-3 flex items-center gap-2 text-sm bg-red-400/8 border border-red-400/25 text-error">
          <AlertCircle size={15} />
          {errorMsg}
        </div>
      {/if}

      <div class="flex items-center justify-end gap-3 pt-2">
        <a href={`/@${data.cleanHandle}`}>
          <Button variant="ghost" type="button" disabled={formState === "submitting"}>
            キャンセル
          </Button>
        </a>
        <Button
          type="submit"
          loading={formState === "submitting"}
          disabled={!title.trim()}
        >
          {#snippet leftIcon()}<Plus size={16} />{/snippet}
          作成する
        </Button>
      </div>
    </form>
  </div>
</div>
