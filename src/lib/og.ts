export * from "./ogHtml.js";

const SYMBOL_FAMILIES = ["Noto Sans Symbols 2", "Noto Sans Symbols"];

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

export async function renderOg(
  html: string,
  text: string,
  ctx?: App.Platform["ctx"],
  cacheControl = "public, max-age=86400, s-maxage=86400"
): Promise<Response> {
  const { ImageResponse, GoogleFont, cache } = await import("@cf-wasm/og/workerd");
  const { htmlToReact } = await import("@cf-wasm/og/html-to-react");
  if (ctx) cache.setExecutionContext(ctx);

  const zenMaru = (weight: 400 | 700) =>
    new GoogleFont("Zen Maru Gothic", { name: "ZenMaru", weight, text });

  const res = await ImageResponse.async(htmlToReact(html), {
    width: 1200,
    height: 630,
    format: "png",
    fonts: [zenMaru(400), zenMaru(700)],
    loadAdditionalAsset: async (code, segment, next) => {
      if (code !== "symbol" && code !== "emoji") return undefined;
      if (code === "emoji") {
        const emoji = await next().catch(() => undefined);
        if (emoji) return emoji;
      }
      for (const family of SYMBOL_FAMILIES) {
        const font = new GoogleFont(family, { name: family, weight: 400, text: segment });
        const data = await font.data.catch(() => null);
        if (data) return [{ name: font.name, weight: font.weight, style: font.style, data }];
      }
      return undefined;
    },
  });
  res.headers.set("Cache-Control", cacheControl);
  return res;
}
