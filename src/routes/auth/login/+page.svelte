<script lang="ts">
  import { AlertCircle, Shield, ArrowLeft } from "lucide-svelte";
  import Button from "$lib/components/ui/Button.svelte";
  import Input from "$lib/components/ui/Input.svelte";
  import Brand from "$lib/components/shell/Brand.svelte";

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

<div data-suisou-layout="stack center middle" data-suisou="min-screen" class="wrap">
  <div data-suisou-layout="stack gap-4" data-suisou="container-s">
    <div>
      <Button href="/" variant="ghost">
        {#snippet leftIcon()}<ArrowLeft />{/snippet}
        トップに戻る
      </Button>
    </div>
    <div data-suisou-layout="stack center">
      <a href="/"><Brand size="lg" /></a>
      <h1 data-suisou-text="fs-24 fw-700 center" class="center">Blueskyアカウントでログイン</h1>
      <p data-suisou-text="fs-14 center" class="sub center">あなたのハンドルを入力して認証します</p>
    </div>

    <div data-suisou-tray data-suisou-layout="stack gap-3" class="card">
      <form onsubmit={handleSubmit} data-suisou-layout="stack gap-3" class="form">
        <Input
          label="Blueskyハンドル"
          placeholder="yourname.bsky.social"
          bind:value={handle}
          disabled={loading}
          autofocus={true}
          autocomplete="username"
          inputmode="email"
          prefix="@"
        />

        {#if error}
          <p data-suisou-item="notice" data-suisou-layout="row" data-suisou="error" role="alert">
            <AlertCircle data-suisou-text="fs-16" />
            {error}
          </p>
        {/if}

        <div data-suisou-layout="row end">
          <Button variant="default" type="submit" {loading} disabled={!handle.trim()}>
            {loading ? "認証中..." : "ログインする"}
          </Button>
        </div>
      </form>

      <div data-suisou-item="media" data-suisou="bd-top" class="note">
        <Shield data-suisou-item="media-figure" data-suisou-text="fs-16" data-suisou="note" />
        <p data-suisou-item="media-content" data-suisou-text="fs-12" class="sub doc">
          認証にはATProtocol OAuth 2.0を使用します。
          パスワードはMadoに送信されません。
          認証後、あなたのDIDとハンドルが声に紐付けられます。
        </p>
      </div>
    </div>
  </div>
</div>

<style>
  .wrap {
    padding: var(--suisou-space-4) var(--suisou-space-3);
  }
  .card {
    padding: var(--suisou-space-4);
  }
  .note {
    padding-block-start: var(--suisou-space-3);
  }
  .sub {
    color: var(--suisou-color-text-note);
  }
</style>
