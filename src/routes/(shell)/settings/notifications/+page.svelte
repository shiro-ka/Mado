<script lang="ts">
  import { untrack } from "svelte";
  import { Bell, Check, ExternalLink, AlertCircle, UserPlus } from "lucide-svelte";
  import { invalidateAll } from "$app/navigation";
  import Toggle from "$lib/components/ui/Toggle.svelte";
  import Button from "$lib/components/ui/button/button.svelte";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  // Seed local optimistic state from the server load; mutated directly on
  // follow / toggle so the UI reacts instantly, then reconciled via invalidateAll.
  let followed = $state(untrack(() => data.following));
  let enabled = $state(untrack(() => data.dmEnabled));

  let following = $state(false); // follow request in flight
  let followError = $state(false);
  let saving = $state(false); // toggle persist in flight
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
        // Refresh server-side viewer state so a reload stays consistent.
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
      // Revert the optimistic flip on failure.
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

<div class="px-6 py-8 max-w-2xl mx-auto">
  <div class="mb-6">
    <h1 class="text-2xl font-bold text-foreground">通知設定</h1>
    <p class="text-sm mt-1 text-muted-foreground">
      新しい声が届いたときのお知らせ方法を設定します
    </p>
  </div>

  {#if !data.configured}
    <div class="rounded-2xl p-8 flex flex-col items-center gap-3 text-center bg-surface border border-dashed border-border-strong">
      <Bell size={32} class="text-subtle opacity-50" />
      <p class="text-sm text-muted-foreground">
        DM通知は現在準備中です。もうしばらくお待ちください。
      </p>
    </div>
  {:else}
    <div class="rounded-2xl bg-surface border border-border overflow-hidden">
      <!-- Toggle row -->
      <div class="flex items-center justify-between gap-4 p-5">
        <div class="flex items-start gap-3">
          <div class="mt-0.5 shrink-0 text-blue-400"><Bell size={20} /></div>
          <div>
            <p class="font-semibold text-foreground">新着をDMで受け取る</p>
            <p class="text-sm mt-0.5 text-muted-foreground">
              mado公式（@{data.official?.handle}）から、新しい声が届いたときにDMでお知らせします。
            </p>
          </div>
        </div>
        <div class="shrink-0">
          <Toggle
            bind:checked={enabled}
            disabled={!followed || saving}
            onCheckedChange={persistToggle}
            label="新着をDMで受け取る"
          />
        </div>
      </div>

      {#if toggleError}
        <div class="px-5 pb-3 -mt-2 flex items-center gap-1.5 text-xs text-error">
          <AlertCircle size={13} />
          設定の保存に失敗しました。時間をおいて再試行してください。
        </div>
      {/if}

      <!-- Status / gate -->
      {#if !followed}
        <div class="border-t border-border bg-elevated/40 p-5 flex flex-col gap-3">
          <div class="flex items-start gap-2 text-sm text-muted-foreground">
            <AlertCircle size={16} class="mt-0.5 shrink-0 text-subtle" />
            <p>
              通知を受け取るには、先に公式アカウントのフォローが必要です。
              <span class="text-subtle">（Blueskyの仕様上、フォローしていないアカウントにはDMが届きません）</span>
            </p>
          </div>
          <div class="flex flex-wrap items-center gap-3">
            <Button size="sm" loading={following} onclick={follow}>
              {#snippet leftIcon()}<UserPlus size={15} />{/snippet}
              公式（@{data.official?.handle}）をフォロー
            </Button>
            <a
              href={profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              bsky.appで開く <ExternalLink size={13} />
            </a>
          </div>
          {#if followError}
            <span class="flex items-center gap-1 text-xs text-error">
              <AlertCircle size={12} />
              フォローに失敗しました。時間をおいて再試行してください。
            </span>
          {/if}
        </div>
      {:else if enabled}
        <div class="border-t border-border bg-elevated/40 px-5 py-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Check size={16} class="shrink-0 text-green-400" />
          新着はmado公式からDMで届きます。
          <span class="text-subtle">（公式のフォローを外すと届かなくなります）</span>
        </div>
      {:else}
        <div class="border-t border-border bg-elevated/40 px-5 py-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Check size={16} class="shrink-0 text-green-400" />
          公式アカウントをフォロー中です。上のスイッチで通知をONにできます。
        </div>
      {/if}
    </div>
  {/if}
</div>
