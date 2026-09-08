<script lang="ts">
  import { untrack } from "svelte";
  import { goto, invalidateAll } from "$app/navigation";
  import { Lock, Save, AlertCircle, Trash2, ArrowLeft, Copy, Check, Pin } from "lucide-svelte";
  import Button from "$lib/components/ui/button/button.svelte";
  import Input from "$lib/components/ui/Input.svelte";
  import Textarea from "$lib/components/ui/Textarea.svelte";
  import Toggle from "$lib/components/ui/Toggle.svelte";
  import BoxSendView from "$lib/components/mado/BoxSendView.svelte";
  import { slugFormatError } from "$lib/validation.js";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  // Share/OG label: prefer the owner's display name, fall back to the handle.
  const ownerName = $derived(data.ownerProfile?.displayName || data.cleanHandle);

  // Owner settings form state
  type FormState = "idle" | "submitting" | "error" | "deleting";
  let title = $state(untrack(() => data.box.title));
  let description = $state(untrack(() => data.box.description ?? ""));
  let slug = $state(untrack(() => data.box.slug));
  let isOpen = $state(untrack(() => data.box.isOpen));
  let formState = $state<FormState>("idle");
  let errorMsg = $state("");

  // SvelteKit reuses this component instance across same-route navigations
  // (e.g. /@me/boxA → /@me/boxB), so $state would keep showing boxA's values —
  // and a save would overwrite boxB with them. Re-seed the form whenever the
  // box identity changes. Keyed on rkey so it does NOT clobber in-progress
  // edits on invalidateAll() (same box), only on an actual box switch.
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
      // The slug is the URL, so a change moves this page — navigate to the new
      // address before revalidating (the old /@handle/<oldslug> no longer resolves).
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
  // Instant client-side format check (same rules as the server's slugSchema).
  const slugErr = $derived(slugFormatError(slug));

  // Shareable public URL of this box (the core "share to get questions" link).
  const publicUrl = $derived(`${data.origin}/@${data.cleanHandle}/${data.box.slug}`);
  const publicUrlDisplay = $derived(publicUrl.replace(/^https?:\/\//, ""));
  let copied = $state(false);
  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(publicUrl);
      copied = true;
      setTimeout(() => (copied = false), 2000);
    } catch {
      // Clipboard API unavailable (insecure context / permissions) — no-op;
      // the URL is still visible for manual copy.
    }
  }

  // Promote this box to the owner's main Mado.
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

<div data-suisou-layout="stack container" class="page">
  {#if data.isOwner}
    <div data-suisou-layout="row">
      <a href={`/@${data.cleanHandle}`}>
        <Button variant="ghost">
          {#snippet leftIcon()}<ArrowLeft />{/snippet}
          プロフィールに戻る
        </Button>
      </a>
      <h1 data-suisou-text="s20 w700">窓の設定</h1>
    </div>

    <div data-suisou-surface="panel" class="card">
      <form onsubmit={handleSave} data-suisou-layout="stack" class="form">
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
        <div data-suisou-layout="stack" class="slug">
          <Input
            label="URL"
            placeholder="ask"
            bind:value={slug}
            error={slugErr ?? undefined}
            helper="英小文字・数字・ハイフンのみ。変更すると以前に共有したURLは開けなくなります。"
            maxlength={30}
            disabled={isBusy}
          />
          <p data-suisou-text="s12" class="preview">
            /@{data.cleanHandle}/<span class="accent">{slug.trim().toLowerCase() || data.box.slug}</span>
          </p>
        </div>

        <div data-suisou-layout="row between">
          <div data-suisou-layout="stack" class="label">
            <p data-suisou-text="s14 w500" class="sub">声の受付</p>
            <p data-suisou-text="s12" class="sub">オフにすると新しい声を受け付けません</p>
          </div>
          <Toggle bind:checked={isOpen} label="声の受付" disabled={isBusy} />
        </div>

        {#if errorMsg}
          <p data-suisou-banner="error" data-suisou-layout="row" role="alert">
            <AlertCircle data-suisou-icon="small" />
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

    <!-- 公開URL -->
    <div data-suisou-surface="panel" data-suisou-media class="strip">
      <Lock data-suisou-icon="small sub" data-suisou-media-icon />
      <div data-suisou-media-content>
        <p data-suisou-text="s12" class="sub">公開URL</p>
        <p data-suisou-text="s14" class="url">{publicUrlDisplay}</p>
      </div>
      <div data-suisou-media-tail>
        <!-- ★コピー済みの状態は aria-pressed。Suisou の Button が持っている語なので、
             手書きの3色分岐（bg/border/text を green に差し替え）が消えた。 -->
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

    <!-- メインMado -->
    <div data-suisou-surface="panel" data-suisou-media class="strip">
      <Pin data-suisou-icon="small sub" data-suisou-media-icon />
      <div data-suisou-media-content>
        <p data-suisou-text="s14 w500">メインMado</p>
        <p data-suisou-text="s12" class="sub">
          {data.isMain
            ? "この窓が /@ハンドル の先頭に表示され、訪問者の送信欄になります"
            : "メインにすると /@ハンドル の先頭に表示されます"}
        </p>
      </div>
      <div data-suisou-media-tail>
        {#if data.isMain}
          <span data-suisou-tag="accent">
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
    <BoxSendView
      box={data.box}
      ownerProfile={data.ownerProfile}
      cleanHandle={data.cleanHandle}
      ownerRegistered={data.ownerRegistered}
      session={data.session}
    />

    <p data-suisou-text="s12" class="sub back">
      <a href={`/@${data.cleanHandle}`}>← @{data.cleanHandle} のプロフィールに戻る</a>
    </p>
  {/if}
</div>

<style>
  .page {
    --suisou-measure: 32rem;
    gap: var(--suisou-space-3);
    padding: var(--suisou-space-4) var(--suisou-space-3);
  }
  .card {
    padding: var(--suisou-space-4);
  }
  .form {
    gap: var(--suisou-space-4);
  }
  .slug {
    gap: var(--suisou-space-1);
  }
  .label {
    gap: 0;
  }
  .strip {
    align-items: center;
  }
  .preview,
  .url {
    font-family: var(--suisou-mono);
    word-break: break-all;
  }
  .preview {
    color: var(--suisou-text-sub);
  }
  .accent {
    color: var(--suisou-accent);
  }
  .sub {
    color: var(--suisou-text-sub);
  }
  .back {
    text-align: center;
  }
</style>
