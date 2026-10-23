<script lang="ts">
  import { AlertCircle, Shield, ArrowLeft, ChevronDown } from "lucide-svelte";
  import Button from "$lib/components/ui/Button.svelte";
  import Input from "$lib/components/ui/Input.svelte";
  import Brand from "$lib/components/shell/Brand.svelte";

  let handle = $state("");
  let other = $state(false);
  let loading = $state<"bsky" | "handle" | null>(null);
  let error = $state("");

  async function login(kind: "bsky" | "handle") {
    loading = kind;
    error = "";

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(kind === "handle" ? { handle: handle.trim().replace(/^@/, "") } : {}),
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
      loading = null;
    }
  }

  function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    if (handle.trim()) login("handle");
  }
</script>

<svelte:head>
  <title>ログイン | Mado</title>
</svelte:head>

<div data-suisou="min-screen" class="wrap">
  <div data-suisou="container-s" class="back">
    <Button href="/" variant="ghost">
      {#snippet leftIcon()}<ArrowLeft />{/snippet}
      トップに戻る
    </Button>
  </div>
  <div data-suisou-layout="stack gap-4" data-suisou="container-s" class="main">
    <div data-suisou-layout="stack center">
      <a href="/"><Brand size="lg" /></a>
      <h1 data-suisou-text="fs-24 fw-700 center" class="center">Blueskyアカウントでログイン</h1>
    </div>

    <div data-suisou-tray data-suisou-layout="stack gap-3" class="card">
      <div data-suisou-layout="stack center">
        <Button variant="default" loading={loading === "bsky"} disabled={loading !== null} onclick={() => login("bsky")}>
          Bluesky でログイン
        </Button>
      </div>

      {#if error}
        <p data-suisou-item="notice" data-suisou-layout="row" data-suisou="error" role="alert">
          <AlertCircle data-suisou-text="fs-16" />
          {error}
        </p>
      {/if}

      <div data-suisou="bd-top" class="other">
        {#if other}
          <form onsubmit={handleSubmit} data-suisou-layout="stack gap-3">
            <Input
              label="ハンドル"
              placeholder="yourname.example.com"
              bind:value={handle}
              disabled={loading !== null}
              autofocus={true}
              autocomplete="username"
              inputmode="email"
              prefix="@"
            />
            <div data-suisou-layout="row end">
              <Button variant="default" type="submit" loading={loading === "handle"} disabled={!handle.trim() || loading !== null}>
                ログインする
              </Button>
            </div>
          </form>
        {:else}
          <div data-suisou-layout="stack center">
            <Button variant="ghost" onclick={() => (other = true)}>
              ほかのサーバーのアカウントでログイン
              {#snippet rightIcon()}<ChevronDown />{/snippet}
            </Button>
          </div>
        {/if}
      </div>

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
    display: grid;
    grid-template-rows: 1fr auto 1fr;
    padding: var(--suisou-space-4) var(--suisou-space-3);
  }
  .back {
    align-self: start;
  }
  .main {
    padding-block: var(--suisou-space-4);
  }
  .card {
    padding: var(--suisou-space-4);
  }
  .other,
  .note {
    padding-block-start: var(--suisou-space-3);
  }
  .sub {
    color: var(--suisou-color-text-note);
  }
</style>
