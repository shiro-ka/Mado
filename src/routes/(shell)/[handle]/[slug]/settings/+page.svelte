<script lang="ts">
  import { untrack } from "svelte";
  import { goto, invalidateAll } from "$app/navigation";
  import { Link, Save, AlertCircle, Trash2, ArrowLeft, Copy, Check, Pin } from "lucide-svelte";
  import Button from "$lib/components/ui/Button.svelte";
  import Input from "$lib/components/ui/Input.svelte";
  import Textarea from "$lib/components/ui/Textarea.svelte";
  import Toggle from "$lib/components/ui/Toggle.svelte";
  import { slugFormatError } from "$lib/validation.js";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  const ownerName = $derived(data.ownerProfile?.displayName || data.cleanHandle);

  type FormState = "idle" | "submitting" | "error" | "deleting";
  let title = $state(untrack(() => data.box.title));
  let description = $state(untrack(() => data.box.description ?? ""));
  let slug = $state(untrack(() => data.box.slug));
  let isOpen = $state(untrack(() => data.box.isOpen));
  let formState = $state<FormState>("idle");
  let saved = $state(false);
  let savedTimer: ReturnType<typeof setTimeout> | undefined;
  let errorMsg = $state("");

  let seededRkey = $state(untrack(() => data.box.rkey));
  $effect(() => {
    if (data.box.rkey !== seededRkey) {
      seededRkey = data.box.rkey;
      title = data.box.title;
      description = data.box.description ?? "";
      slug = data.box.slug;
      isOpen = data.box.isOpen;
      formState = "idle";
      errorMsg = "";
    }
  });

  async function handleSave(e: SubmitEvent) {
    e.preventDefault();
    if (!title.trim() || slugErr || formState === "submitting") return;
    formState = "submitting";
    errorMsg = "";
    const nextSlug = slug.trim().toLowerCase();
    const slugChanged = nextSlug.length > 0 && nextSlug !== data.box.slug;
    try {
      const res = await fetch(`/api/boxes/${data.box.rkey}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          slug: nextSlug || undefined,
          isOpen,
        }),
      });
      if (!res.ok) {
        const d = (await res.json()) as { message?: string };
        throw new Error(d.message ?? "更新に失敗しました");
      }
      formState = "idle";
      saved = true;
      clearTimeout(savedTimer);
      savedTimer = setTimeout(() => (saved = false), 3000);
      if (slugChanged) {
        await goto(`/@${data.cleanHandle}/${nextSlug}/settings`);
      }
      await invalidateAll();
    } catch (err) {
      formState = "error";
      errorMsg = err instanceof Error ? err.message : "更新に失敗しました";
    }
  }

  let deleteError = $state("");
  async function handleDelete() {
    formState = "deleting";
    deleteError = "";
    try {
      const res = await fetch(`/api/boxes/${data.box.rkey}`, { method: "DELETE" });
      if (!res.ok) {
        const d = (await res.json()) as { message?: string };
        throw new Error(d.message ?? "削除に失敗しました");
      }
      await goto(`/@${data.cleanHandle}`);
      await invalidateAll();
    } catch (err) {
      formState = "idle";
      deleteError = err instanceof Error ? err.message : "削除に失敗しました";
    }
  }

  const isBusy = $derived(formState === "submitting" || formState === "deleting");
  const slugErr = $derived(slugFormatError(slug));

  const publicUrl = $derived(`${data.origin}/@${data.cleanHandle}/${data.box.slug}`);
  const publicUrlDisplay = $derived(publicUrl.replace(/^https?:\/\//, ""));
  let copied = $state(false);
  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(publicUrl);
      copied = true;
      setTimeout(() => (copied = false), 2000);
    } catch {
    }
  }

  let settingMain = $state(false);
  async function toggleMain() {
    if (settingMain) return;
    settingMain = true;
    errorMsg = "";
    try {
      const res = await fetch(`/api/boxes/${data.box.rkey}/main`, { method: data.isMain ? "DELETE" : "POST" });
      if (!res.ok) {
        const d = (await res.json()) as { message?: string };
        throw new Error(d.message ?? "設定に失敗しました");
      }
      await invalidateAll();
    } catch (err) {
      errorMsg = err instanceof Error ? err.message : "設定に失敗しました";
    } finally {
      settingMain = false;
    }
  }
</script>

<svelte:head>
  <title>窓の設定 - {data.box.title} | Mado</title>
</svelte:head>

<div data-suisou-layout="stack gap-3" data-suisou="container-s py-4 px-3">
  <div>
    <Button href={`/@${data.cleanHandle}/${data.box.slug}`} variant="ghost">
      {#snippet leftIcon()}<ArrowLeft />{/snippet}
      窓に戻る
    </Button>
  </div>
  <h1 data-suisou-text="fs-24 fw-700">窓の設定</h1>

  <div data-suisou-tray data-suisou="p-4">
    <form onsubmit={handleSave} data-suisou-layout="stack gap-4" class="form">
      <Input
        label="窓の名前"
        bind:value={title}
        maxlength={30}
        required
        disabled={isBusy}
      />
      <Textarea
        label="窓の説明"
        bind:value={description}
        maxlength={300}
        showCount
        rows={4}
        disabled={isBusy}
      />
      <div data-suisou-layout="stack gap-1" class="slug">
        <Input
          label="URL"
          bind:value={slug}
          error={slugErr ?? undefined}
          helper="変更すると以前のURLは開けなくなります。"
          maxlength={30}
          disabled={isBusy}
        />
        <p data-suisou-text="fs-12" data-suisou="note">
          <code>/@{data.cleanHandle}/<span data-suisou="accent">{slug.trim().toLowerCase() || data.box.slug}</span></code>
        </p>
      </div>

      <label data-suisou-layout="row between">
        <span data-suisou-layout="stack gap-0" class="label">
          <span data-suisou-text="fs-14 fw-500">声の受付</span>
          <span data-suisou-text="fs-12" data-suisou="note">オフにすると新しい声を受け付けません</span>
        </span>
        <Toggle bind:checked={isOpen} disabled={isBusy} />
      </label>

      {#if errorMsg}
        <p data-suisou-item="notice" data-suisou-layout="row" data-suisou="error" role="alert">
          <AlertCircle data-suisou-text="fs-16" />
          {errorMsg}
        </p>
      {/if}

      <div data-suisou-layout="row end">
        {#if saved}
          <span data-suisou-text="fs-14" role="status" data-suisou="success">保存しました</span>
        {/if}
        <Button
          type="submit"
          loading={formState === "submitting"}
          disabled={!title.trim() || !!slugErr}
        >
          {#snippet leftIcon()}<Save />{/snippet}
          保存する
        </Button>
      </div>
    </form>
  </div>

  <div data-suisou-tray data-suisou-item="media" class="strip">
    <Link data-suisou-item="media-figure" data-suisou-text="fs-16" data-suisou="note" />
    <div data-suisou-item="media-content">
      <p data-suisou-text="fs-12" data-suisou="note">公開URL</p>
      <p data-suisou-text="fs-14"><code>{publicUrlDisplay}</code></p>
    </div>
    <div data-suisou-item="media-tail">
      <Button
        variant="secondary"
        aria-pressed={copied}
        onclick={copyUrl}
        aria-label="公開URLをコピー"
      >
        {#snippet leftIcon()}
          {#if copied}<Check />{:else}<Copy />{/if}
        {/snippet}
        {copied ? "コピー済み" : "コピー"}
      </Button>
    </div>
  </div>

  <div data-suisou-tray data-suisou-item="media" class="strip">
    <Pin data-suisou-item="media-figure" data-suisou-text="fs-16" data-suisou="note" />
    <div data-suisou-item="media-content">
      <p data-suisou-text="fs-14 fw-500">メインの窓</p>
      <p data-suisou-text="fs-12" data-suisou="note">
        {data.isMain
          ? "この窓が /@ハンドル の先頭に表示され、訪問者の送信欄になります"
          : "メインにすると /@ハンドル の先頭に表示されます"}
      </p>
    </div>
    <div data-suisou-item="media-tail">
      <Button variant="secondary" loading={settingMain} onclick={toggleMain}>
        {data.isMain ? "メインを解除" : "メインにする"}
      </Button>
    </div>
  </div>

  <div data-suisou-layout="row end">
    <Button type="button" variant="destructive" commandfor="delete-box" command="show-modal">
      {#snippet leftIcon()}<Trash2 />{/snippet}
      削除
    </Button>
  </div>
</div>

<dialog
  id="delete-box"
  closedby={formState === "deleting" ? "none" : "any"}
  data-suisou-tray
  data-suisou-layout="stack gap-3"
  data-suisou="p-4"
>
  <p data-suisou-text="fs-14">
    窓を削除すると、届いた声とあなたの返信も消えます。<br />この操作は元に戻せませんが、削除しますか？
  </p>
  {#if deleteError}
    <p data-suisou-item="notice" data-suisou-layout="row" data-suisou="error" role="alert">
      <AlertCircle data-suisou-text="fs-16" />
      {deleteError}
    </p>
  {/if}
  <div data-suisou-layout="row end">
    <Button type="button" variant="secondary" commandfor="delete-box" command="close" disabled={formState === "deleting"}>
      キャンセル
    </Button>
    <Button type="button" variant="destructive" loading={formState === "deleting"} onclick={handleDelete}>
      {#snippet leftIcon()}<Trash2 />{/snippet}
      削除する
    </Button>
  </div>
</dialog>

<style>
  .strip {
    align-items: center;
  }
</style>
