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
      if (slugChanged) {
        await goto(`/@${data.cleanHandle}/${nextSlug}/settings`);
      }
      await invalidateAll();
    } catch (err) {
      formState = "error";
      errorMsg = err instanceof Error ? err.message : "更新に失敗しました";
    }
  }

  async function handleDelete() {
    if (!confirm("この窓を削除しますか？この操作は取り消せません。")) return;
    formState = "deleting";
    errorMsg = "";
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
      errorMsg = err instanceof Error ? err.message : "削除に失敗しました";
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

<div data-suisou-layout="stack gap-3" data-suisou="container-s" class="page">
  <div>
    <Button href={`/@${data.cleanHandle}/${data.box.slug}`} variant="ghost">
      {#snippet leftIcon()}<ArrowLeft />{/snippet}
      窓に戻る
    </Button>
  </div>
  <h1 data-suisou-text="fs-24 fw-700">窓の設定</h1>

  <div data-suisou-tray class="card">
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
        <p data-suisou-text="fs-12" class="preview">
          /@{data.cleanHandle}/<span class="accent">{slug.trim().toLowerCase() || data.box.slug}</span>
        </p>
      </div>

      <div data-suisou-layout="row between">
        <div data-suisou-layout="stack gap-0" class="label">
          <p data-suisou-text="fs-14 fw-500">声の受付</p>
          <p data-suisou-text="fs-12" class="sub">オフにすると新しい声を受け付けません</p>
        </div>
        <Toggle bind:checked={isOpen} label="声の受付" disabled={isBusy} />
      </div>

      {#if errorMsg}
        <p data-suisou-item="notice" data-suisou-layout="row" data-suisou="error" role="alert">
          <AlertCircle data-suisou-text="fs-16" />
          {errorMsg}
        </p>
      {/if}

      <div data-suisou-layout="row end">
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
      <p data-suisou-text="fs-12" class="sub">公開URL</p>
      <p data-suisou-text="fs-14" class="url">{publicUrlDisplay}</p>
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
      <p data-suisou-text="fs-12" class="sub">
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
    <Button
      type="button"
      variant="destructive"
      loading={formState === "deleting"}
      onclick={handleDelete}
    >
      {#snippet leftIcon()}<Trash2 />{/snippet}
      削除
    </Button>
  </div>
</div>

<style>
  .page {
    padding: var(--suisou-space-4) var(--suisou-space-3);
  }
  .card {
    padding: var(--suisou-space-4);
  }
  .strip {
    align-items: center;
  }
  .preview,
  .url {
    font-family: var(--suisou-font-mono);
    word-break: break-all;
  }
  .preview {
    color: var(--suisou-color-text-note);
  }
  .accent {
    color: var(--suisou-color-accent);
  }
  .sub {
    color: var(--suisou-color-text-note);
  }
</style>
