<script lang="ts">
  import { untrack } from "svelte";
  import { goto, invalidateAll } from "$app/navigation";
  import { Shield, LogIn, Lock, Globe, Save, AlertCircle, Trash2, ArrowLeft } from "lucide-svelte";
  import Button from "$lib/components/ui/Button.svelte";
  import Badge from "$lib/components/ui/Badge.svelte";
  import Input from "$lib/components/ui/Input.svelte";
  import Textarea from "$lib/components/ui/Textarea.svelte";
  import Toggle from "$lib/components/ui/Toggle.svelte";
  import SendQuestionForm from "$lib/components/mado/SendQuestionForm.svelte";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  const ownerDisplayName = $derived(
    data.ownerProfile?.displayName ?? `@${data.ownerProfile?.handle ?? data.cleanHandle}`
  );

  // Owner settings form state
  type FormState = "idle" | "submitting" | "error" | "deleting";
  let title = $state(untrack(() => data.box.title));
  let description = $state(untrack(() => data.box.description ?? ""));
  let isOpen = $state(untrack(() => data.box.isOpen));
  let formState = $state<FormState>("idle");
  let errorMsg = $state("");

  async function handleSave(e: SubmitEvent) {
    e.preventDefault();
    if (!title.trim() || formState === "submitting") return;
    formState = "submitting";
    errorMsg = "";
    try {
      const res = await fetch(`/api/boxes/${data.box.rkey}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), description: description.trim() || undefined, isOpen }),
      });
      if (!res.ok) {
        const d = (await res.json()) as { message?: string };
        throw new Error(d.message ?? "更新に失敗しました");
      }
      formState = "idle";
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
</script>

<svelte:head>
  <title>{data.box.title} — @{data.cleanHandle} の質問箱 | Mado</title>
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
        <h1 class="text-xl font-bold text-primary">窓の設定</h1>
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
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-muted">質問の受付</p>
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
              disabled={!title.trim()}
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
          <p class="text-xs text-muted mb-0.5">公開URL</p>
          <p class="text-sm font-mono text-primary truncate">mado.blue/@{data.cleanHandle}/{data.box.slug}</p>
        </div>
      </div>

    {:else}
      <!-- Visitor: send form -->
      <!-- Owner header -->
      <div class="flex items-center gap-3 mb-6">
        {#if data.ownerProfile?.avatar}
          <img
            src={data.ownerProfile.avatar}
            alt={data.ownerProfile.handle}
            class="w-10 h-10 rounded-full object-cover shrink-0"
          />
        {:else}
          <div class="w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-bold bg-accent text-white">
            {(data.ownerProfile?.handle ?? data.cleanHandle)[0]?.toUpperCase() ?? "?"}
          </div>
        {/if}
        <div class="min-w-0">
          <p class="font-semibold text-sm text-primary">{ownerDisplayName}</p>
          <a
            href={`https://bsky.app/profile/${data.ownerProfile?.handle ?? data.cleanHandle}`}
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-1 text-xs hover:opacity-80 transition-opacity text-blue-400"
          >
            <Globe size={10} />
            @{data.ownerProfile?.handle ?? data.cleanHandle}
          </a>
        </div>
      </div>

      <!-- Box info -->
      <div class="rounded-2xl p-6 mb-5 bg-surface border border-border">
        <div class="flex items-start gap-3 mb-3">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1">
              <h1 class="text-lg font-bold text-primary">{data.box.title}</h1>
              <Badge variant={data.box.isOpen ? "success" : "muted"} dot size="sm">
                {data.box.isOpen ? "受付中" : "受付停止"}
              </Badge>
            </div>
            {#if data.box.description}
              <p class="text-sm leading-relaxed text-muted">{data.box.description}</p>
            {/if}
          </div>
        </div>
        <div class="flex items-center gap-1.5">
          <Lock size={11} class="text-subtle" />
          <span class="text-xs text-subtle">ECIES暗号化で保護されています</span>
        </div>
      </div>

      <!-- Semi-anonymous disclosure -->
      <div class="rounded-xl p-4 mb-5 flex items-start gap-3 bg-amber-400/7 border border-amber-400/25">
        <Shield size={15} class="shrink-0 mt-0.5 text-amber-400" />
        <p class="text-xs leading-relaxed text-muted">
          <span class="font-semibold text-amber-400">半匿名のご注意：</span>{" "}
          このサービスは完全匿名ではありません。あなたのBlueskyアカウント情報は
          <strong class="text-primary">ボックスのオーナーにのみ</strong>
          開示されます。第三者には公開されません。
        </p>
      </div>

      <!-- Owner not registered -->
      {#if !data.ownerRegistered}
        <div class="rounded-xl p-6 text-center bg-surface border border-border">
          <p class="font-semibold text-sm mb-1 text-primary">このユーザーはMadoに登録されていません</p>
          <p class="text-xs text-muted">質問を送るには、オーナーがMadoにログインしている必要があります。</p>
        </div>

      <!-- Box closed -->
      {:else if !data.box.isOpen}
        <div class="rounded-xl p-6 text-center bg-surface border border-border">
          <p class="font-semibold text-sm mb-1 text-primary">現在この質問箱は受付停止中です</p>
          <p class="text-xs text-muted">オーナーが受付を再開するまでお待ちください。</p>
        </div>

      <!-- Not logged in -->
      {:else if !data.session}
        <div class="rounded-2xl p-6 text-center flex flex-col items-center gap-4 bg-surface border border-border">
          <div class="w-12 h-12 rounded-2xl flex items-center justify-center bg-accent-light">
            <LogIn size={20} class="text-blue-400" />
          </div>
          <div>
            <p class="font-semibold text-sm mb-1 text-primary">質問するにはログインが必要です</p>
            <p class="text-xs leading-relaxed text-muted">
              Blueskyアカウントでログインして質問を送りましょう。
              送り主はオーナーのみに開示されます。
            </p>
          </div>
          <a href={`/auth/login?next=/@${data.cleanHandle}/${data.box.slug}`} class="w-full">
            <Button size="lg" class="w-full">ログインして質問する</Button>
          </a>
        </div>

      <!-- Logged in -->
      {:else}
        <div class="rounded-2xl p-6 bg-surface border border-border">
          <SendQuestionForm
            boxOwnerDid={data.box.ownerDid}
            boxRkey={data.box.rkey}
            senderHandle={data.session.handle}
          />
        </div>
      {/if}

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
