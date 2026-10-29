export const BRAND_DESC = "半匿名メッセージ";

export type Theme = {
  bg: string;
  panel: string;
  item: string;
  text: string;
  note: string;
  accent: string;
  line: string;
  lineStrong: string;
  radius: number;
};

export const defaultTheme: Theme = {
  bg: "#11172b",
  panel: "#1a2135",
  item: "#282f45",
  text: "#e7ebf6",
  note: "#b3b7c1",
  accent: "#78aef3",
  line: "rgba(255,255,255,0.15)",
  lineStrong: "rgba(255,255,255,0.25)",
  radius: 14,
};

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

export function fitVoice(s: string): number {
  const n = [...s].length;
  return n <= 28 ? 60 : n <= 44 ? 52 : n <= 64 ? 44 : n <= 88 ? 38 : 32;
}

export async function fetchImageDataUri(url?: string): Promise<string | null> {
  if (!url) return null;
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

export function wordmark(t: Theme, size: number): string {
  return (
    `<div style="display:flex;align-items:baseline;">` +
    `<span style="font-size:${size}px;font-weight:700;letter-spacing:-0.02em;color:${t.text};">Mado</span>` +
    `<span style="font-size:${Math.round(size * 0.5)}px;color:${t.note};margin-left:10px;">${BRAND_DESC}</span>` +
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

const FALLBACK_FAMILIES = ["Noto Sans JP", "Noto Sans SC", "Noto Sans Symbols 2", "Noto Sans Symbols", "Noto Sans"];

export async function renderOg(html: string, text: string, ctx?: App.Platform["ctx"]): Promise<Response> {
  const { ImageResponse, GoogleFont, cache } = await import("@cf-wasm/og/workerd");
  const { htmlToReact } = await import("@cf-wasm/og/html-to-react");
  if (ctx) cache.setExecutionContext(ctx);

  const zenMaru = (weight: 400 | 500 | 700) =>
    new GoogleFont("Zen Maru Gothic", { name: "ZenMaru", weight, text });

  const res = await ImageResponse.async(htmlToReact(html), {
    width: 1200,
    height: 630,
    format: "png",
    fonts: [zenMaru(400), zenMaru(500), zenMaru(700)],
    loadAdditionalAsset: async (code, segment, next) => {
      if (code === "emoji") {
        const emoji = await next().catch(() => undefined);
        if (emoji) return emoji;
      }
      const loaded = await Promise.all(
        FALLBACK_FAMILIES.map(async (family) => {
          try {
            const font = new GoogleFont(family, { name: family, weight: 400, text: segment });
            return { name: font.name, weight: font.weight, style: font.style, data: await font.data };
          } catch {
            return null;
          }
        })
      );
      const fonts = loaded.filter((f) => f !== null);
      return fonts.length ? fonts : undefined;
    },
  });
  res.headers.set("Cache-Control", "public, max-age=86400, s-maxage=86400");
  return res;
}
