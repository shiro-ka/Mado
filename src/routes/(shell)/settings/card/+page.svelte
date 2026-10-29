<script lang="ts">
  import { untrack } from "svelte";
  import { ArrowLeft, Save, AlertCircle } from "lucide-svelte";
  import Button from "$lib/components/ui/Button.svelte";
  import { CARD_PALETTE, CARD_SLOTS, DEFAULT_STYLE, type CardSlot } from "$lib/cardStyle.js";
  import { themeFor, truncate, boxCardHtml, koeCardHtml } from "$lib/ogHtml.js";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  const LABELS: Record<CardSlot, string> = { background: "背景", bubble: "吹き出し", icon: "アイコン" };

  let colors = $state<Record<CardSlot, string>>(
    untrack(() => ({
      background: data.colors.background ?? DEFAULT_STYLE.background,
      bubble: data.colors.bubble ?? DEFAULT_STYLE.bubble,
      icon: data.colors.icon ?? DEFAULT_STYLE.icon,
    }))
  );
  let saving = $state(false);
  let saved = $state(false);
  let saveError = $state(false);

  const SAMPLE_VOICE = "ここに届いた声が入ります";
  const theme = $derived(themeFor(colors));
  const card = $derived({
    name: data.sample.name,
    handle: data.sample.handle,
    avatarUri: data.sample.avatar,
  });
  const boxPreview = $derived(boxCardHtml(theme, { ...card, title: truncate(data.sample.title, 44) }));
  const koePreview = $derived(
    koeCardHtml(theme, { ...card, body: SAMPLE_VOICE, boxTitle: truncate(data.sample.title, 32) })
  );
  let frameWidth = $state(0);
  const scale = $derived(frameWidth / 1200);

  function pick(slot: CardSlot, value: string) {
    colors[slot] = value.toLowerCase();
    saved = false;
  }

  async function save() {
    saving = true;
    saved = false;
    saveError = false;
    try {
      const res = await fetch("/api/card-style", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(colors),
      });
      if (!res.ok) throw new Error();
      saved = true;
    } catch {
      saveError = true;
    } finally {
      saving = false;
    }
  }
</script>

<svelte:head>
  <title>リンクカードの見た目 | Mado</title>
</svelte:head>

<div data-suisou-layout="stack gap-3" data-suisou="container-s py-4 px-3">
  <div>
    <Button href="/settings" variant="ghost">
      {#snippet leftIcon()}<ArrowLeft />{/snippet}
      設定に戻る
    </Button>
  </div>
  <h1 data-suisou-text="fs-24 fw-700">リンクカードの見た目</h1>

  <div data-suisou-tray data-suisou-layout="stack gap-2" data-suisou="p-3">
    {#each [{ html: boxPreview, label: "窓のリンクカードの見本" }, { html: koePreview, label: "声のリンクカードの見本" }] as preview}
      <div class="frame" bind:clientWidth={frameWidth} style={`height:${630 * scale}px`} role="img" aria-label={preview.label}>
        <div class="card" style={`transform:scale(${scale})`}>{@html preview.html}</div>
      </div>
    {/each}
  </div>

  {#each CARD_SLOTS as slot}
    {@const custom = !CARD_PALETTE[slot].includes(colors[slot])}
    <div data-suisou-tray data-suisou-layout="stack gap-2" data-suisou="p-3">
      <span data-suisou-text="fs-16 fw-700">{LABELS[slot]}</span>
      <div data-suisou-layout="row wrap gap-2">
        {#each CARD_PALETTE[slot] as color}
          <button
            type="button"
            class="swatch"
            style={`background:${color}`}
            aria-label={color}
            aria-pressed={colors[slot] === color}
            onclick={() => pick(slot, color)}
          ></button>
        {/each}
        <label class="swatch custom" class:chosen={custom} style={custom ? `background:${colors[slot]}` : undefined}>
          <input type="color" aria-label="自由に指定" value={colors[slot]} oninput={(e) => pick(slot, e.currentTarget.value)} />
        </label>
      </div>
    </div>
  {/each}

  {#if saveError}
    <p data-suisou-item="notice" data-suisou-layout="row" data-suisou="error" role="alert">
      <AlertCircle data-suisou-text="fs-16" />
      保存に失敗しました。時間をおいて再試行してください。
    </p>
  {/if}

  <div data-suisou-layout="row end">
    {#if saved}
      <span data-suisou-text="fs-14" role="status" data-suisou="success">保存しました</span>
    {/if}
    <Button loading={saving} onclick={save}>
      {#snippet leftIcon()}<Save />{/snippet}
      保存する
    </Button>
  </div>
</div>

<style>
  .frame {
    position: relative;
    width: 100%;
    overflow: hidden;
    border-radius: var(--suisou-radius);
  }
  .card {
    position: absolute;
    top: 0;
    left: 0;
    display: flex;
    width: 1200px;
    height: 630px;
    transform-origin: top left;
  }
  .swatch {
    position: relative;
    width: 2.5rem;
    height: 2.5rem;
    padding: 0;
    border-radius: var(--suisou-radius-pill);
    border: 2px solid var(--suisou-color-line-strong);
    cursor: pointer;
  }
  .swatch[aria-pressed="true"],
  .swatch.chosen {
    outline: 2px solid var(--suisou-color-accent);
    outline-offset: 2px;
  }
  .custom:not(.chosen) {
    background: conic-gradient(#f47eb0, #f48d3c, #e8b931, #9bb93d, #44c1b8, #78aef3, #c58ff3, #f47eb0);
  }
  .custom input {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
    cursor: pointer;
  }
</style>
