<script lang="ts">
  import type { Snippet } from "svelte";
  import { page } from "$app/state";
  import { AlertCircle } from "lucide-svelte";
  import Button, { type ButtonVariant } from "$lib/components/ui/Button.svelte";
  import Input from "$lib/components/ui/Input.svelte";
  import { safeNext } from "$lib/loginNext.js";

  interface Props {
    label?: string;
    variant?: ButtonVariant;
    look?: "button" | "other";
    addAccount?: boolean;
    block?: boolean;
    leftIcon?: Snippet;
  }

  let { label, variant = "default", look = "button", addAccount = false, block = false, leftIcon }: Props = $props();

  const uid = $props.id();
  const dialogId = `login-${uid}`;
  const next = $derived(
    safeNext(page.url.searchParams.get("next")) ??
      (page.url.pathname === "/" ? undefined : `${page.url.pathname}${page.url.search}`),
  );

  let handle = $state("");
  let loading = $state<"bsky" | "handle" | null>(null);
  let error = $state("");

  async function login(kind: "bsky" | "handle") {
    loading = kind;
    error = "";
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          next,
          addAccount,
          ...(kind === "handle" ? { handle: handle.trim().replace(/^@/, "") } : {}),
        }),
      });
      const data = (await res.json()) as { redirectUrl?: string; message?: string };
      if (!res.ok || !data.redirectUrl) throw new Error(data.message ?? "ログインできませんでした");
      window.location.href = data.redirectUrl;
    } catch (err) {
      loading = null;
      if (kind === "bsky") {
        window.location.href = "/?login_error=1";
      } else {
        error = err instanceof Error ? err.message : "ログインできませんでした";
      }
    }
  }

  function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    if (handle.trim()) login("handle");
  }
</script>

{#if look === "button"}
  {#if block}
    <button type="button" data-suisou-button="block" disabled={loading !== null} onclick={() => login("bsky")}>
      {@render leftIcon?.()}
      {label ?? "Bluesky でログイン"}
    </button>
  {:else}
    <Button {variant} loading={loading === "bsky"} disabled={loading !== null} onclick={() => login("bsky")}>{label ?? "Bluesky でログイン"}</Button>
  {/if}
{:else}
  {#if block}
    <button type="button" data-suisou-button="block" commandfor={dialogId} command="show-modal">
      {@render leftIcon?.()}
      {label ?? "ほかのサーバーのアカウントでログイン"}
    </button>
  {:else}
    <Button variant="ghost" commandfor={dialogId} command="show-modal">{label ?? "ほかのサーバーのアカウントでログイン"}</Button>
  {/if}

  <dialog
    id={dialogId}
    closedby={loading === "handle" ? "none" : "any"}
    data-suisou-tray
    data-suisou="p-4" class="dialog"
  >
    <form onsubmit={handleSubmit} data-suisou-layout="stack gap-3">
      <p data-suisou-text="fs-14">Bluesky 以外のサーバーにアカウントがある場合は、ハンドルを入力してください。</p>
      <Input
        label="ハンドル"
        placeholder="yourname.example.com"
        bind:value={handle}
        disabled={loading !== null}
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
        <Button type="button" variant="secondary" commandfor={dialogId} command="close" disabled={loading === "handle"}>
          キャンセル
        </Button>
        <Button type="submit" variant="default" loading={loading === "handle"} disabled={!handle.trim() || loading !== null}>
          ログインする
        </Button>
      </div>
    </form>
  </dialog>
{/if}

<style>
  .dialog {
    text-align: start;
  }
</style>
