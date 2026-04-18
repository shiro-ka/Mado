<script lang="ts">
  import { MessageCircle, AtSign, AlertCircle, Shield } from "lucide-svelte";
  import Button from "$lib/components/ui/Button.svelte";
  import Input from "$lib/components/ui/Input.svelte";

  let handle = $state("");
  let loading = $state(false);
  let error = $state("");

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    if (!handle.trim()) return;

    loading = true;
    error = "";

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handle: handle.trim().replace(/^@/, "") }),
      });

      const data = (await res.json()) as { redirectUrl?: string; error?: string; message?: string };

      if (!res.ok) {
        throw new Error(data.message ?? data.error ?? "ログインに失敗しました");
      }

      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      }
    } catch (err) {
      error = err instanceof Error ? err.message : "ログインに失敗しました";
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>ログイン | Mado</title>
</svelte:head>

<div class="min-h-dvh flex flex-col items-center justify-center px-4 py-16 bg-background">
  <div class="w-full max-w-md">
    <!-- Header -->
    <div class="flex flex-col items-center gap-3 mb-8">
      <a href="/" class="flex items-center gap-2">
        <div class="w-10 h-10 rounded-xl flex items-center justify-center bg-accent">
          <MessageCircle size={20} class="text-white" />
        </div>
        <span class="font-bold text-xl text-primary">Mado</span>
      </a>
      <h1 class="text-2xl font-bold text-center text-primary">Blueskyアカウントでログイン</h1>
      <p class="text-sm text-center text-muted">あなたのハンドルを入力して認証します</p>
    </div>

    <!-- Card -->
    <div class="rounded-2xl p-8 bg-surface border border-border">
      <form onsubmit={handleSubmit} class="flex flex-col gap-5">
        <Input
          label="Blueskyハンドル"
          placeholder="yourname.bsky.social"
          bind:value={handle}
          helper="例：alice.bsky.social または alice.com"
          disabled={loading}
          autofocus={true}
          autocomplete="username"
          inputmode="email"
        >
          {#snippet leftAddon()}<AtSign size={16} />{/snippet}
        </Input>

        {#if error}
          <div class="rounded-lg p-3 flex items-center gap-2 text-sm bg-red-400/8 border border-red-400/25 text-error">
            <AlertCircle size={15} />
            {error}
          </div>
        {/if}

        <Button
          type="submit"
          size="lg"
          {loading}
          disabled={!handle.trim()}
          class="w-full"
        >
          {loading ? "認証中..." : "ログインする"}
        </Button>
      </form>

      <div class="mt-5 pt-5 flex items-start gap-2.5 border-t border-border">
        <Shield size={14} class="shrink-0 mt-0.5 text-subtle" />
        <p class="text-xs leading-relaxed text-subtle">
          認証にはATProtocol OAuth 2.0を使用します。
          パスワードはMadoに送信されません。
          認証後、あなたのDIDとハンドルが質問に紐付けられます。
        </p>
      </div>
    </div>

    <p class="text-center text-xs mt-6 text-subtle">
      <a href="/" class="hover:opacity-80 transition-opacity">← トップページに戻る</a>
    </p>
  </div>
</div>
