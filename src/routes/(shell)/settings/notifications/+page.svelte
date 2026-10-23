<script lang="ts">
  import { untrack } from "svelte";
  import { Bell, Check, ExternalLink, AlertCircle, UserPlus, ArrowLeft } from "lucide-svelte";
  import { invalidateAll } from "$app/navigation";
  import Toggle from "$lib/components/ui/Toggle.svelte";
  import Button from "$lib/components/ui/Button.svelte";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  let followed = $state(untrack(() => data.following));
  let enabled = $state(untrack(() => data.dmEnabled));

  let following = $state(false);
  let followError = $state(false);
  let saving = $state(false);
  let toggleError = $state(false);

  const profileUrl = $derived(
    data.official ? `https://bsky.app/profile/${data.official.handle}` : "#"
  );

  async function follow() {
    if (following) return;
    following = true;
    followError = false;
    try {
      const res = await fetch("/api/notifications/follow", { method: "POST" });
      if (res.ok) {
        followed = true;
        await invalidateAll();
      } else {
        followError = true;
      }
    } catch {
      followError = true;
    } finally {
      following = false;
    }
  }

  async function persistToggle(next: boolean) {
    saving = true;
    toggleError = false;
    try {
      const res = await fetch("/api/notifications/prefs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dmEnabled: next }),
      });
      if (!res.ok) throw new Error();
    } catch {
      enabled = !next;
      toggleError = true;
    } finally {
      saving = false;
    }
  }
</script>

<svelte:head>
  <title>通知設定 | Mado</title>
</svelte:head>

<div data-suisou-layout="stack gap-3" data-suisou="container-s" class="page">
  <div>
    <Button href="/settings" variant="ghost">
      {#snippet leftIcon()}<ArrowLeft />{/snippet}
      設定に戻る
    </Button>
  </div>
  <h1 data-suisou-text="fs-24 fw-700">通知設定</h1>

  {#if !data.configured}
    <div data-suisou-tray data-suisou-layout="stack center" data-suisou="bd-dash" class="empty">
      <Bell data-suisou-text="fs-20" data-suisou="note" class="big" />
      <p data-suisou-text="fs-14" class="sub">
        DM通知は現在準備中です。もうしばらくお待ちください。
      </p>
    </div>
  {:else}
    <div data-suisou-tray data-suisou="p-0" class="card">
      <div data-suisou-item="media" class="row">
        <Bell data-suisou-item="media-figure" data-suisou-text="fs-20" data-suisou="accent" />
        <div data-suisou-item="media-content">
          <p data-suisou-text="fs-16 fw-700">新着をDMで受け取る</p>
          <p data-suisou-text="fs-14" class="sub doc">
            Mado公式（@{data.official?.handle}）から、新しい声が届いたときにDMでお知らせします。
          </p>
        </div>
        <div data-suisou-item="media-tail">
          <Toggle
            bind:checked={enabled}
            disabled={!followed || saving}
            onCheckedChange={persistToggle}
            label="新着をDMで受け取る"
          />
        </div>
      </div>

      {#if toggleError}
        <p data-suisou-layout="row" data-suisou-text="fs-12" class="err row" role="alert">
          <AlertCircle data-suisou-text="fs-16" />
          設定の保存に失敗しました。時間をおいて再試行してください。
        </p>
      {/if}

      {#if !followed}
        <div data-suisou-layout="stack" data-suisou="bd-top" class="row foot">
          <div data-suisou-item="media">
            <AlertCircle data-suisou-item="media-figure" data-suisou-text="fs-20" data-suisou="note" />
            <p data-suisou-item="media-content" data-suisou-text="fs-14" class="sub doc">
              DMで通知を受け取るには、公式アカウントのフォローが必要です。
            </p>
          </div>
          <div data-suisou-layout="row wrap">
            <Button variant="default" loading={following} onclick={follow}>
              {#snippet leftIcon()}<UserPlus />{/snippet}
              公式（@{data.official?.handle}）をフォロー
            </Button>
            <a
              data-suisou-layout="row"
              data-suisou-text="fs-14 link"
              class="sub"
              href={profileUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              bsky.appで開く
              <ExternalLink data-suisou-text="fs-16" />
            </a>
          </div>
          {#if followError}
            <p data-suisou-layout="row" data-suisou-text="fs-12" class="err" role="alert">
              <AlertCircle data-suisou-text="fs-16" />
              フォローに失敗しました。時間をおいて再試行してください。
            </p>
          {/if}
        </div>
      {:else}
        <div data-suisou-layout="row" data-suisou-text="fs-14" data-suisou="bd-top" class="row foot sub">
          <Check data-suisou-text="fs-16" data-suisou="success" />
          {#if enabled}
            <span>
              新着はMado公式からDMで届きます。
              <span class="sub">（公式のフォローを外すと届かなくなります）</span>
            </span>
          {:else}
            <span>公式アカウントをフォロー中です。上のスイッチで通知をONにできます。</span>
          {/if}
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .page {
    padding: var(--suisou-space-4) var(--suisou-space-3);
  }
  .empty {
    padding: var(--suisou-space-4);
  }
  .empty :global(.big) {
    width: 2rem;
    height: 2rem;
  }

  .row {
    padding: var(--suisou-space-3);
  }

  .sub {
    color: var(--suisou-color-text-note);
  }
  .err {
    color: var(--suisou-color-error);
  }
</style>
