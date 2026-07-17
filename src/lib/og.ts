/**
 * Shared building blocks for the dynamic OG images (窓OG / 声OG).
 *
 * Everything here emits HTML strings that `@cf-wasm/og`'s `htmlToReact` turns
 * into a satori element tree. Keep it to flex/absolute + inline styles (no CSS
 * vars, no color-mix — satori doesn't grok them), which is exactly what the
 * design lab (static/ogp-lab.html) was authored against so ports stay mechanical.
 *
 * Design decisions (see memory: mado-ogp-redesign):
 *  - 窓OG = フレーム×パネル, 声OG = ミニマル(配置A)
 *  - ブランド表記は「Mado」/「半匿名メッセージ」、オーナー行は「◯◯ のMado / への声」
 *  - アバターは角丸四角、取得失敗/webp時は頭文字フォールバック
 *  - テーマは dark/light/dawn（?theme= で切替、既定 dark）
 */

export const BRAND_DESC = "半匿名メッセージ";

export type Theme = {
  bg: string;
  ink: string;
  sub: string;
  pane: string;
  chip: string;
  accent: string;
  frameBorder: string;
  chipBorder: string;
  avaText: string;
};

function rgba(hex: string, a: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

function mkTheme(accent: string, rest: Omit<Theme, "accent" | "frameBorder" | "chipBorder">): Theme {
  return { ...rest, accent, frameBorder: rgba(accent, 0.45), chipBorder: rgba(accent, 0.3) };
}

export const THEMES: Record<string, Theme> = {
  dark: mkTheme("#3b82f6", {
    bg: "linear-gradient(140deg,#152238 0%,#0c1424 100%)",
    ink: "#eaf1fb",
    sub: "#8fa6c4",
    pane: "rgba(122,170,255,0.10)",
    chip: "rgba(122,170,255,0.10)",
    avaText: "#eaf1fb",
  }),
  light: mkTheme("#2f6fe0", {
    bg: "linear-gradient(140deg,#f5f9ff 0%,#e6eefb 100%)",
    ink: "#14233f",
    sub: "#5b7096",
    pane: "rgba(44,90,160,0.10)",
    chip: "rgba(44,90,160,0.08)",
    avaText: "#14233f",
  }),
  dawn: mkTheme("#f2a15c", {
    bg: "linear-gradient(155deg,#141a30 0%,#3a2540 55%,#6b3a4a 100%)",
    ink: "#fdeede",
    sub: "#e6b9a8",
    pane: "rgba(255,210,180,0.12)",
    chip: "rgba(255,210,180,0.12)",
    avaText: "#fdeede",
  }),
};

export function resolveTheme(searchParams: URLSearchParams): { key: string; t: Theme } {
  const q = searchParams.get("theme") ?? "";
  const key = q in THEMES ? q : "dark";
  return { key, t: THEMES[key] };
}

export function escapeHtml(s: string): string {
  return s.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!
  );
}

export function truncate(s: string, max: number): string {
  if ([...s].length <= max) return s;
  return [...s].slice(0, max - 1).join("") + "…";
}

/** 声本文の文字数 → フォントサイズ（satori互換の段階式。lab の fitVoice と同一）。 */
export function fitVoice(s: string): number {
  const n = [...s].length;
  return n <= 28 ? 60 : n <= 44 ? 52 : n <= 64 ? 44 : n <= 88 ? 38 : 32;
}

/**
 * Fetch an avatar and inline it as a data URI. satori can't decode webp, so we
 * only accept png/jpeg; anything else (or a failure) returns null → caller falls
 * back to the initial tile.
 */
export async function fetchImageDataUri(url?: string): Promise<string | null> {
  if (!url) return null;
  // Bluesky's CDN serves avatars as webp by default (satori can't decode webp).
  // The `@jpeg` variant forces a jpeg re-encode, so normalize bsky avatar URLs.
  let target = url;
  if (target.includes("cdn.bsky.app/") && !/@[a-z]+$/.test(target)) {
    target += "@jpeg";
  }
  try {
    const res = await fetch(target);
    if (!res.ok) return null;
    const ct = res.headers.get("content-type") ?? "";
    if (!/^image\/(png|jpe?g)$/.test(ct)) return null;
    const b64 = Buffer.from(new Uint8Array(await res.arrayBuffer())).toString("base64");
    return `data:${ct};base64,${b64}`;
  } catch {
    return null;
  }
}

/**
 * The Mado mark (吹き出し窓＋取手) as a single-color line glyph, embedded as an
 * SVG data URI so satori rasterizes it reliably (inline <svg> support is spotty).
 */
export function logoImg(color: string, size: number): string {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" ` +
    `fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">` +
    `<path d="M17 4 a4 4 0 0 1 4 4 v6 a4 4 0 0 1 -4 4 h-4 l-5 3 v-3 h-1 a4 4 0 0 1 -4 -4 V8 a4 4 0 0 1 4 -4 z"/>` +
    `<line x1="12" y1="7" x2="12" y2="14"/>` +
    `<circle cx="9" cy="10.5" r="1.05" fill="${color}" stroke="none"/>` +
    `<circle cx="15" cy="10.5" r="1.05" fill="${color}" stroke="none"/>` +
    `</svg>`;
  const uri = `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
  return `<img src="${uri}" width="${size}" height="${size}" style="width:${size}px;height:${size}px;" />`;
}

/** ブランドロックアップ（インライン）: Mado ＋ 半匿名メッセージ。 */
export function wordmark(t: Theme, size: number): string {
  return (
    `<div style="display:flex;align-items:baseline;">` +
    `<span style="font-size:${size}px;font-weight:700;letter-spacing:-0.02em;color:${t.ink};">Mado</span>` +
    `<span style="font-size:${Math.round(size * 0.5)}px;color:${t.sub};margin-left:10px;">${BRAND_DESC}</span>` +
    `</div>`
  );
}

/** 角丸四角アバター。avatarUri があれば画像、無ければ頭文字タイル。 */
function avatarSquare(t: Theme, avatarUri: string | null, initial: string, size: number): string {
  const r = Math.round(size * 0.26);
  if (avatarUri) {
    return (
      `<img src="${avatarUri}" width="${size}" height="${size}" ` +
      `style="width:${size}px;height:${size}px;border-radius:${r}px;object-fit:cover;border:2px solid ${t.accent};" />`
    );
  }
  return (
    `<div style="display:flex;align-items:center;justify-content:center;width:${size}px;height:${size}px;` +
    `border-radius:${r}px;background:${t.chip};border:2px solid ${t.accent};color:${t.avaText};` +
    `font-size:${Math.round(size * 0.42)}px;font-weight:700;">${escapeHtml(initial)}</div>`
  );
}

/**
 * 窓OG/声OG 共通プロフィール: [角丸四角アイコン | 上=名前␣ラベル / 下=@handle]。
 * name と suffix(のMado / への声) は余白で分離、どちらも ink 色。
 */
export function profile(
  t: Theme,
  name: string,
  suffix: string,
  handle: string,
  avatarUri: string | null,
  size = 58
): string {
  const initial = [...(name || "@")][0] ?? "@";
  const nameSize = Math.round(size * 0.4);
  return (
    `<div style="display:flex;align-items:center;gap:15px;">` +
    avatarSquare(t, avatarUri, initial, size) +
    `<div style="display:flex;flex-direction:column;gap:8px;">` +
    `<div style="display:flex;align-items:baseline;gap:13px;">` +
    `<span style="display:flex;font-size:${nameSize}px;font-weight:700;line-height:1.05;color:${t.ink};">${escapeHtml(name)}</span>` +
    `<span style="display:flex;font-size:${nameSize}px;line-height:1.05;color:${t.ink};">${suffix}</span>` +
    `</div>` +
    `<span style="display:flex;font-size:${Math.round(size * 0.3)}px;line-height:1.05;color:${t.sub};">@${escapeHtml(handle)}</span>` +
    `</div>` +
    `</div>`
  );
}
