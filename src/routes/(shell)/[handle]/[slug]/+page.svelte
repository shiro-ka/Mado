<script lang="ts">
  import { untrack } from "svelte";
  import { goto, invalidateAll } from "$app/navigation";
  import { Lock, Save, AlertCircle, Trash2, ArrowLeft, Copy, Check, Pin } from "lucide-svelte";
  import Button from "$lib/components/ui/Button.svelte";
  import Input from "$lib/components/ui/Input.svelte";
  import Textarea from "$lib/components/ui/Textarea.svelte";
  import Toggle from "$lib/components/ui/Toggle.svelte";
  import BoxSendView from "$lib/components/mado/BoxSendView.svelte";
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
        await goto(`/@${data.cleanHandle}/${nextSlug}`);
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
  async function handleSetMain() {
    if (settingMain || data.isMain) return;
    settingMain = true;
    errorMsg = "";
    try {
      const res = await fetch(`/api/boxes/${data.box.rkey}/main`, { method: "POST" });
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
  <title>{data.box.title} - {ownerName} のMado | Mado</title>
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="Mado" />
  <meta property="og:title" content={`${data.box.title} - ${ownerName} のMado`} />
  <meta property="og:description" content={data.box.description || "Madoで半匿名の声を送ろう"} />
  <meta property="og:url" content={`${data.origin}/@${data.cleanHandle}/${data.box.slug}`} />
  <meta property="og:image" content={`${data.origin}/og/@${data.cleanHandle}/${data.box.slug}`} />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:image" content={`${data.origin}/og/@${data.cleanHandle}/${data.box.slug}`} />
</svelte:head>

<div data-suisou-layout="stack gap-3" data-suisou="container-s" class="page">
  {#if data.isOwner}
    <div data-suisou-layout="row">
      <Button href={`/@${data.cleanHandle}`} variant="ghost">
        {#snippet leftIcon()}<ArrowLeft />{/snippet}
        プロフィールに戻る
      </Button>
      <h1 data-suisou-text="fs-20 fw-700">窓の設定</h1>
    </div>

    <div data-suisou-tray class="card">
      <form onsubmit={handleSave} data-suisou-layout="stack gap-4" class="form">
        <Input
          label="タイトル（必須）"
          placeholder="なんでも声を届けてください！"
          bind:value={title}
          maxlength={100}
          required
          disabled={isBusy}
        />
        <Textarea
          label="説明文"
          placeholder="どんな声でも歓迎です。"
          bind:value={description}
          maxlength={300}
          showCount
          rows={4}
          disabled={isBusy}
        />
        <div data-suisou-layout="stack gap-1" class="slug">
          <Input
            label="URL"
            placeholder="ask"
            bind:value={slug}
            error={slugErr ?? undefined}
            helper="英小文字・数字・ハイフンのみ。変更すると以前に共有したURLは開けなくなります。"
            maxlength={30}
            disabled={isBusy}
          />
          <p data-suisou-text="fs-12" class="preview">
            /@{data.cleanHandle}/<span class="accent">{slug.trim().toLowerCase() || data.box.slug}</span>
          </p>
        </div>

        <div data-suisou-layout="row between">
          <div data-suisou-layout="stack gap-0" class="label">
            <p data-suisou-text="fs-14 fw-500" class="sub">声の受付</p>
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

        <div data-suisou-layout="row between">
          <Button
            type="button"
            variant="destructive"
            loading={formState === "deleting"}
            onclick={handleDelete}
          >
            {#snippet leftIcon()}<Trash2 />{/snippet}
            削除
          </Button>
          <Button
            variant="outline"
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
      <Lock data-suisou-item="media-figure" data-suisou-text="fs-16" data-suisou="note" />
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
        <p data-suisou-text="fs-14 fw-500">メインMado</p>
        <p data-suisou-text="fs-12" class="sub">
          {data.isMain
            ? "この窓が /@ハンドル の先頭に表示され、訪問者の送信欄になります"
            : "メインにすると /@ハンドル の先頭に表示されます"}
        </p>
      </div>
      <div data-suisou-item="media-tail">
        {#if data.isMain}
          <span data-suisou-item="tag" data-suisou="accent">
            <Pin />
            メイン
          </span>
        {:else}
          <Button variant="secondary" loading={settingMain} onclick={handleSetMain}>
            メインにする
          </Button>
        {/if}
      </div>
    </div>
  {:else}
    <div>
      <Button variant="ghost" href={`/@${data.cleanHandle}`}>
        {#snippet leftIcon()}<ArrowLeft />{/snippet}
        プロフィールに戻る
      </Button>
    </div>

    <BoxSendView
      box={data.box}
      ownerProfile={data.ownerProfile}
      cleanHandle={data.cleanHandle}
      ownerRegistered={data.ownerRegistered}
      session={data.session}
    />
  {/if}
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
