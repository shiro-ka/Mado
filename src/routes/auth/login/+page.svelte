<script lang="ts">
  import { MessageCircle, AlertCircle, Shield } from "lucide-svelte";
  import Button from "$lib/components/ui/button/button.svelte";
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
    <div data-suisou-layout="stack" class="mb-8">
      <a href="/" data-suisou-layout="row">
        <div class="w-10 h-10 rounded-lg flex items-center justify-center bg-primary">
          <MessageCircle size={20} class="text-background" />
        </div>
        <span data-suisou-text="s20 w700" class="text-foreground">Mado</span>
      </a>
      <h1 data-suisou-text="s24 w700" class="text-center text-foreground">Blueskyアカウントでログイン</h1>
      <p class="text-center text-muted-foreground">あなたのハンドルを入力して認証します</p>
    </div>

    <!-- Card -->
    <div data-suisou-surface="panel" class="p-8">
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
          prefix="@"
        />

        {#if error}
          <div data-suisou-layout="row" data-suisou-banner="error" class="text-error">
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
        <p data-suisou-text="s12" class="leading-relaxed text-subtle">
          認証にはATProtocol OAuth 2.0を使用します。
          パスワードはMadoに送信されません。
          認証後、あなたのDIDとハンドルが声に紐付けられます。
        </p>
      </div>
    </div>

    <p data-suisou-text="s12" class="text-center mt-6 text-subtle">
      <a href="/" class="hover:opacity-80 transition-opacity">← トップページに戻る</a>
    </p>
  </div>
</div>
