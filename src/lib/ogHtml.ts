import { DEFAULT_STYLE } from "./cardStyle.js";

export type CardStyle = {
  icon?: string | null;
  background?: string | null;
  bubble?: string | null;
};

export type Theme = {
  bg: string;
  text: string;
  note: string;
  accent: string;
  panel: string;
  panelText: string;
  panelNote: string;
  item: string;
  line: string;
  radius: number;
};

const LIGHT_TEXT = "#e7ebf6";
const DARK_TEXT = "#1b2030";

export function isColor(value: unknown): value is string {
  return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value);
}

function channels(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function toHex([r, g, b]: [number, number, number]): string {
  return "#" + [r, g, b].map((c) => Math.round(c).toString(16).padStart(2, "0")).join("");
}

function mix(a: string, b: string, amount: number): string {
  const [ar, ag, ab] = channels(a);
  const [br, bg, bb] = channels(b);
  return toHex([ar + (br - ar) * amount, ag + (bg - ag) * amount, ab + (bb - ab) * amount]);
}

function rgba(hex: string, alpha: number): string {
  const [r, g, b] = channels(hex);
  return `rgba(${r},${g},${b},${alpha})`;
}

function luminance(hex: string): number {
  const [r, g, b] = channels(hex).map((c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

function textOn(surface: string): string {
  return contrast(LIGHT_TEXT, surface) >= contrast(DARK_TEXT, surface) ? LIGHT_TEXT : DARK_TEXT;
}

export function themeFor(style: CardStyle = {}): Theme {
  const bg = isColor(style.background) ? style.background : DEFAULT_STYLE.background;
  const panel = isColor(style.bubble) ? style.bubble : DEFAULT_STYLE.bubble;
  const accent = isColor(style.icon) ? style.icon : DEFAULT_STYLE.icon;
  const text = textOn(bg);
  const panelText = textOn(panel);
  return {
    bg,
    text,
    note: mix(text, bg, 0.25),
    accent,
    panel,
    panelText,
    panelNote: mix(panelText, panel, 0.25),
    item: mix(panel, panelText, 0.07),
    line: rgba(panelText, 0.15),
    radius: 14,
  };
}

export const defaultTheme = themeFor();

export function escapeHtml(s: string): string {
  return s.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!
  );
}

function charClass(c: string): string {
  if (/\s/.test(c)) return "space";
  if (/[\u3041-\u309f]/.test(c)) return "hiragana";
  if (/[\u30a0-\u30ff\u31f0-\u31ff\uff66-\uff9f]/.test(c)) return "katakana";
  if (/[\u3400-\u9fff\uf900-\ufaff々〆]/.test(c)) return "kanji";
  if (/[（「『【〔［｛〈《(\[{]/.test(c)) return "open";
  if (/[、。，．）」』】〕］｝〉》！？!?,.)\]}…‥・：；:;]/.test(c)) return "close";
  return "other";
}

function phrases(text: string): string[] {
  const out: string[] = [];
  let current = "";
  let prev = "";
  for (const c of text) {
    const kind = charClass(c);
    const startsPhrase =
      current !== "" &&
      ((kind === "open" && prev !== "open") ||
        (prev === "space" && kind !== "space") ||
        ((kind === "kanji" || kind === "katakana" || kind === "other") && (prev === "hiragana" || prev === "close")));
    if (startsPhrase) {
      out.push(current);
      current = "";
    }
    current += c;
    prev = kind;
  }
  if (current) out.push(current);
  return out;
}

export function phraseHtml(text: string): string {
  return phrases(text)
    .map((p) => `<span style="display:flex;white-space:pre-wrap;">${escapeHtml(p)}</span>`)
    .join("");
}

export function truncate(s: string, max: number): string {
  if ([...s].length <= max) return s;
  return [...s].slice(0, max - 1).join("") + "…";
}

export function fitVoice(s: string): number {
  const n = [...s].length;
  return n <= 20 ? 52 : n <= 40 ? 44 : n <= 60 ? 38 : n <= 80 ? 32 : 28;
}

export function logoImg(color: string, size: number): string {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" ` +
    `fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">` +
    `<path d="M17 4 a4 4 0 0 1 4 4 v6 a4 4 0 0 1 -4 4 h-4 l-5 3 v-3 h-1 a4 4 0 0 1 -4 -4 V8 a4 4 0 0 1 4 -4 z"/>` +
    `<line x1="12" y1="7" x2="12" y2="14"/>` +
    `<circle cx="9" cy="10.5" r="1.05" fill="${color}" stroke="none"/>` +
    `<circle cx="15" cy="10.5" r="1.05" fill="${color}" stroke="none"/>` +
    `</svg>`;
  const uri = `data:image/svg+xml;base64,${btoa(svg)}`;
  return `<img src="${uri}" width="${size}" height="${size}" style="width:${size}px;height:${size}px;" />`;
}

export function wordmark(t: Theme, size: number): string {
  return (
    `<div style="display:flex;align-items:baseline;">` +
    `<span style="font-size:${size}px;font-weight:700;letter-spacing:-0.02em;color:${t.text};">Mado</span>` +
    `</div>`
  );
}

function avatarSquare(t: Theme, avatarUri: string | null, initial: string, size: number): string {
  const r = Math.round(size * 0.26);
  if (avatarUri) {
    return (
      `<img src="${avatarUri}" width="${size}" height="${size}" ` +
      `style="width:${size}px;height:${size}px;border-radius:${r}px;object-fit:cover;" />`
    );
  }
  return (
    `<div style="display:flex;align-items:center;justify-content:center;width:${size}px;height:${size}px;` +
    `border-radius:${r}px;background:${t.item};color:${t.text};` +
    `font-size:${Math.round(size * 0.42)}px;font-weight:700;">${escapeHtml(initial)}</div>`
  );
}

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
    `<span style="display:flex;font-size:${nameSize}px;font-weight:700;line-height:1.05;color:${t.text};">${escapeHtml(name)}</span>` +
    `<span style="display:flex;font-size:${nameSize}px;line-height:1.05;color:${t.text};">${suffix}</span>` +
    `</div>` +
    `<span style="display:flex;font-size:${Math.round(size * 0.3)}px;line-height:1.05;color:${t.note};">@${escapeHtml(handle)}</span>` +
    `</div>` +
    `</div>`
  );
}

export function brand(t: Theme, logoSize: number, wordSize: number): string {
  return `<div style="display:flex;align-items:center;gap:${Math.round(logoSize * 0.28)}px;">${logoImg(t.accent, logoSize)}${wordmark(t, wordSize)}</div>`;
}

export function boxCardHtml(
  t: Theme,
  data: { title: string; name: string; handle: string; avatarUri: string | null }
): string {
  const prof = profile(t, data.name, "の窓", data.handle, data.avatarUri);
  return (
    `<div style="display:flex;width:100%;height:100%;background:${t.bg};position:relative;font-family:'ZenMaru','Zen Maru Gothic';">` +
    `<div style="position:absolute;top:52px;left:66px;display:flex;">${brand(t, 72, 32)}</div>` +
    `<div style="position:absolute;top:150px;left:74px;right:74px;bottom:150px;display:flex;align-items:center;justify-content:center;">` +
    `<div style="display:flex;flex-wrap:wrap;justify-content:center;text-align:center;font-size:68px;line-height:1.3;font-weight:700;letter-spacing:-0.01em;color:${t.text};">${phraseHtml(data.title)}</div>` +
    `</div>` +
    `<div style="position:absolute;right:74px;bottom:44px;display:flex;">${prof}</div>` +
    `</div>`
  );
}

function tailImg(t: Theme): string {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="56" height="44" viewBox="0 0 56 44">` +
    `<path d="M0 0 H56 V4 L10 44 L0 4 Z" fill="${t.panel}"/>` +
    `<path d="M0 4 L10 44 L56 4" fill="none" stroke="${t.line}" stroke-width="1.5" stroke-linejoin="round"/>` +
    `</svg>`;
  return `<img src="data:image/svg+xml;base64,${btoa(svg)}" width="56" height="44" style="width:56px;height:44px;" />`;
}

export function koeCardHtml(
  t: Theme,
  data: { body: string; boxTitle: string; name: string; handle: string; avatarUri: string | null }
): string {
  const tag = data.boxTitle
    ? `<div style="display:flex;"><div style="display:flex;padding:6px 16px;background:${t.item};border-radius:999px;font-size:22px;color:${t.panelNote};">${escapeHtml(data.boxTitle)}</div></div>`
    : "";
  const prof = profile(t, data.name, "への声", data.handle, data.avatarUri);
  return (
    `<div style="display:flex;width:100%;height:100%;background:${t.bg};position:relative;font-family:'ZenMaru','Zen Maru Gothic';">` +
    `<div style="position:absolute;top:52px;left:66px;display:flex;">${brand(t, 72, 32)}</div>` +
    `<div style="position:absolute;top:168px;left:120px;right:120px;bottom:140px;display:flex;flex-direction:column;background:${t.panel};border:1.5px solid ${t.line};border-radius:${t.radius * 2}px;padding:28px 40px;">` +
    tag +
    `<div style="display:flex;flex:1;align-items:center;justify-content:center;">` +
    `<div style="display:flex;flex-wrap:wrap;justify-content:center;text-align:center;font-size:${fitVoice(data.body)}px;line-height:1.5;font-weight:700;color:${t.panelText};">${phraseHtml(data.body)}</div>` +
    `</div>` +
    `</div>` +
    `<div style="position:absolute;left:176px;bottom:100px;display:flex;">${tailImg(t)}</div>` +
    `<div style="position:absolute;right:120px;bottom:40px;display:flex;">${prof}</div>` +
    `</div>`
  );
}
