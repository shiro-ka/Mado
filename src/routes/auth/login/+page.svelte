<script lang="ts">
  import { MessageCircle, AlertCircle, Shield } from "lucide-svelte";
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

<div data-suisou-layout="pin" data-suisou="min-screen" class="wrap">
  <div data-suisou-layout="stack gap-4" class="col">
    <div data-suisou-layout="stack center">
      <a data-suisou-layout="row" href="/">
        <span data-suisou-item="square"><MessageCircle data-suisou-text="fs-20" data-suisou="accent" /></span>
        <span data-suisou-text="fs-20 fw-700">Mado</span>
      </a>
      <h1 data-suisou-text="fs-24 fw-700 center" class="center">Blueskyアカウントでログイン</h1>
      <p data-suisou-text="fs-14 center" class="sub center">あなたのハンドルを入力して認証します</p>
    </div>

    <div data-suisou-tray data-suisou-layout="stack gap-3" class="card">
      <form onsubmit={handleSubmit} data-suisou-layout="stack gap-3" class="form">
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
          <p data-suisou-item="notice" data-suisou-layout="row" data-suisou="error" role="alert">
            <AlertCircle data-suisou-text="fs-16" />
            {error}
          </p>
        {/if}

        <Button variant="default" wide type="submit" {loading} disabled={!handle.trim()}>
          {loading ? "認証中..." : "ログインする"}
        </Button>
      </form>

      <div data-suisou-item="media" data-suisou="bd-top" class="note">
        <Shield data-suisou-item="media-figure" data-suisou-text="fs-16" data-suisou="sub" />
        <p data-suisou-item="media-content" data-suisou-text="fs-12 doc" class="sub">
          認証にはATProtocol OAuth 2.0を使用します。
          パスワードはMadoに送信されません。
          認証後、あなたのDIDとハンドルが声に紐付けられます。
        </p>
      </div>
    </div>

    <p data-suisou-text="fs-12 center" class="sub center">
      <a href="/">← トップページに戻る</a>
    </p>
  </div>
</div>

<style>
  .wrap {
    padding: var(--suisou-space-4) var(--suisou-space-3);
  }
  .col {
    width: 100%;
    max-width: 28rem;
  }
  .card {
    padding: var(--suisou-space-4);
  }
  .note {
    padding-block-start: var(--suisou-space-3);
  }
  .sub {
    color: var(--suisou-color-text-sub);
  }
</style>
