<script lang="ts">
  import { untrack } from "svelte";
  import { goto, invalidateAll } from "$app/navigation";
  import { Lock, Save, AlertCircle, Trash2, ArrowLeft, Copy, Check, Pin } from "lucide-svelte";
  import Button from "$lib/components/ui/button/button.svelte";
  import { Badge } from "$lib/components/ui/badge";
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
    if (!confirm("この質問箱を削除しますか？この操作は取り消せません。")) return;
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

<div class="px-4 py-10">
  <div class="mx-auto max-w-lg">
    {#if data.isOwner}
      <!-- Owner: settings UI -->
      <div class="flex items-center gap-3 mb-8">
        <a href={`/@${data.cleanHandle}`}>
          <Button variant="ghost" size="sm">
            {#snippet leftIcon()}<ArrowLeft size={15} />{/snippet}
            プロフィールに戻る
          </Button>
        </a>
        <h1 class="text-xl font-bold text-foreground">窓の設定</h1>
      </div>

      <div class="rounded-2xl p-8 mb-5 bg-surface border border-border">
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
          <div>
            <Input
              label="URL"
              placeholder="ask"
              bind:value={slug}
              error={slugErr ?? undefined}
              helper="英小文字・数字・ハイフンのみ。変更すると以前に共有したURLは開けなくなります。"
              maxlength={30}
              disabled={isBusy}
            />
            <p class="mt-1.5 text-xs font-mono text-subtle break-all">
              /@{data.cleanHandle}/<span class="text-blue-400">{slug.trim().toLowerCase() || data.box.slug}</span>
            </p>
          </div>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-muted-foreground">質問の受付</p>
              <p class="text-xs mt-0.5 text-subtle">オフにすると新しい質問を受け付けません</p>
            </div>
            <Toggle bind:checked={isOpen} label="質問の受付" disabled={isBusy} />
          </div>

          {#if errorMsg}
            <div class="rounded-lg p-3 flex items-center gap-2 text-sm bg-red-400/8 border border-red-400/25 text-error">
              <AlertCircle size={15} />
              {errorMsg}
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
            <Button
              type="submit"
              loading={formState === "submitting"}
              disabled={!title.trim() || !!slugErr}
            >
              {#snippet leftIcon()}<Save size={16} />{/snippet}
              保存する
            </Button>
          </div>
        </form>
      </div>

      <!-- Public URL -->
      <div class="rounded-xl p-4 flex items-center gap-3 bg-surface border border-border">
        <Lock size={14} class="text-subtle shrink-0" />
        <div class="flex-1 min-w-0">
          <p class="text-xs text-muted-foreground mb-0.5">公開URL</p>
          <p class="text-sm font-mono text-foreground truncate">{publicUrlDisplay}</p>
        </div>
        <button
          type="button"
          onclick={copyUrl}
          aria-label="公開URLをコピー"
          class="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer border {copied ? 'bg-green-400/10 border-green-400/30 text-green-400' : 'bg-elevated border-border text-muted-foreground hover:text-foreground'}"
        >
          {#if copied}
            <Check size={13} />
            コピー済み
          {:else}
            <Copy size={13} />
            コピー
          {/if}
        </button>
      </div>

      <!-- Main Mado -->
      <div class="rounded-xl p-4 mt-5 flex items-center gap-3 bg-surface border border-border">
        <Pin size={14} class="text-subtle shrink-0" />
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-foreground">メインMado</p>
          <p class="text-xs text-muted-foreground mt-0.5">
            {data.isMain
              ? "この窓が /@ハンドル の先頭に表示され、訪問者の送信欄になります"
              : "メインにすると /@ハンドル の先頭に表示されます"}
          </p>
        </div>
        {#if data.isMain}
          <Badge variant="default" size="sm">
            <Pin size={11} class="mr-0.5" />
            メイン
          </Badge>
        {:else}
          <Button variant="secondary" size="sm" loading={settingMain} onclick={handleSetMain}>
            メインにする
          </Button>
        {/if}
      </div>

    {:else}
      <!-- Visitor: send screen for this box -->
      <BoxSendView
        box={data.box}
        ownerProfile={data.ownerProfile}
        cleanHandle={data.cleanHandle}
        ownerRegistered={data.ownerRegistered}
        session={data.session}
      />

      <!-- Back link -->
      <div class="mt-5 text-center">
        <a
          href={`/@${data.cleanHandle}`}
          class="text-xs hover:opacity-80 transition-opacity text-subtle"
        >
          ← @{data.cleanHandle} のプロフィールに戻る
        </a>
      </div>
    {/if}
  </div>
</div>
