<script lang="ts">
  import { untrack } from "svelte";
  import { goto, invalidateAll } from "$app/navigation";
  import { ArrowLeft, Save, AlertCircle, Trash2 } from "lucide-svelte";
  import Button from "$lib/components/ui/Button.svelte";
  import Input from "$lib/components/ui/Input.svelte";
  import Textarea from "$lib/components/ui/Textarea.svelte";
  import Toggle from "$lib/components/ui/Toggle.svelte";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  type FormState = "idle" | "submitting" | "error" | "deleting";

  let title = $state(untrack(() => data.box.title));
  let description = $state(untrack(() => data.box.description ?? ""));
  let isOpen = $state(untrack(() => data.box.isOpen));
  let formState = $state<FormState>("idle");
  let error = $state("");

  async function handleSave(e: SubmitEvent) {
    e.preventDefault();
    if (!title.trim() || formState === "submitting") return;

    formState = "submitting";
    error = "";

    try {
      const res = await fetch(`/api/boxes/${data.box.rkey}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          isOpen,
        }),
      });

      if (!res.ok) {
        const d = (await res.json()) as { message?: string };
        throw new Error(d.message ?? "更新に失敗しました");
      }

      await goto("/dashboard/boxes");
      await invalidateAll();
    } catch (err) {
      formState = "error";
      error = err instanceof Error ? err.message : "更新に失敗しました";
    }
  }

  async function handleDelete() {
    if (!confirm("この質問箱を削除しますか？この操作は取り消せません。")) return;

    formState = "deleting";
    error = "";

    try {
      const res = await fetch(`/api/boxes/${data.box.rkey}`, { method: "DELETE" });
      if (!res.ok) {
        const d = (await res.json()) as { message?: string };
        throw new Error(d.message ?? "削除に失敗しました");
      }
      await goto("/dashboard/boxes");
      await invalidateAll();
    } catch (err) {
      formState = "idle";
      error = err instanceof Error ? err.message : "削除に失敗しました";
    }
  }

  const isBusy = $derived(formState === "submitting" || formState === "deleting");
</script>

<svelte:head>
  <title>質問箱を編集 | Mado</title>
</svelte:head>

<div class="px-6 py-8 max-w-2xl mx-auto">
  <div class="flex items-center gap-3 mb-8">
    <a href="/dashboard/boxes">
      <Button variant="ghost" size="sm">
        {#snippet leftIcon()}<ArrowLeft size={15} />{/snippet}
        戻る
      </Button>
    </a>
    <h1 class="text-2xl font-bold text-primary">質問箱を編集</h1>
  </div>

  <div class="rounded-2xl p-8 bg-surface border border-border">
    <form onsubmit={handleSave} class="flex flex-col gap-6">
      <Input
        label="タイトル（必須）"
        placeholder="なんでも質問してください！"
        bind:value={title}
        maxlength={100}
        required
        disabled={isBusy}
      />

      <Textarea
        label="説明文"
        placeholder="どんな質問でも歓迎です。"
        bind:value={description}
        maxlength={300}
        showCount
        rows={4}
        disabled={isBusy}
      />

      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-muted">質問の受付</p>
          <p class="text-xs mt-0.5 text-subtle">オフにすると新しい質問を受け付けません</p>
        </div>
        <Toggle bind:checked={isOpen} label="質問の受付" disabled={isBusy} />
      </div>

      {#if error}
        <div class="rounded-lg p-3 flex items-center gap-2 text-sm bg-red-400/8 border border-red-400/25 text-error">
          <AlertCircle size={15} />
          {error}
        </div>
      {/if}

      <div class="flex items-center justify-between gap-3 pt-2">
        <Button
          type="button"
          variant="destructive"
          size="sm"
          loading={formState === "deleting"}
          onclick={handleDelete}
        >
          {#snippet leftIcon()}<Trash2 size={14} />{/snippet}
          削除
        </Button>

        <div class="flex items-center gap-3">
          <a href="/dashboard/boxes">
            <Button variant="ghost" type="button" disabled={formState === "submitting"}>
              キャンセル
            </Button>
          </a>
          <Button
            type="submit"
            loading={formState === "submitting"}
            disabled={!title.trim()}
          >
            {#snippet leftIcon()}<Save size={16} />{/snippet}
            保存する
          </Button>
        </div>
      </div>
    </form>
  </div>
</div>
