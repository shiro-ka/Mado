import type { RequestHandler } from "./$types";
import { resolveHandle, getKoeRecord } from "$lib/atproto";

const FALLBACK_TEXT = "匿名の質問が届きました";
const BRAND = "半匿名質問箱 Mado (窓)";

function escapeHtml(s: string): string {
  return s.replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[c]!
  );
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max - 1) + "…";
}

export const GET: RequestHandler = async ({ params, platform }) => {
  const { ImageResponse, GoogleFont, cache } = await import("@cf-wasm/og/workerd");
  const { htmlToReact } = await import("@cf-wasm/og/html-to-react");
  if (platform?.context) cache.setExecutionContext(platform.context);

  const cleanHandle = decodeURIComponent(params.handle).replace(/^@/, "");

  let body = FALLBACK_TEXT;
  try {
    const did = await resolveHandle(cleanHandle);
    if (did) {
      const koe = await getKoeRecord(did, params.rkey);
      if (koe?.body) body = koe.body;
    }
  } catch {
    // fall through to default
  }

  const display = truncate(body, 100);
  const handleLine = `@${cleanHandle} への質問`;
  const allText = display + handleLine + BRAND;

  const element = htmlToReact(`
    <div style="display:flex;flex-direction:column;justify-content:space-between;width:100%;height:100%;background:linear-gradient(135deg,#060c18 0%,#0b1726 100%);color:#deeeff;font-family:NotoJP;padding:80px;">
      <div style="display:flex;font-size:24px;color:#7aaac8;">${escapeHtml(handleLine)}</div>
      <div style="display:flex;font-size:44px;line-height:1.5;font-weight:700;flex-wrap:wrap;">${escapeHtml(display)}</div>
      <div style="display:flex;font-size:22px;color:#7aaac8;">${BRAND}</div>
    </div>
  `);

  const fontBold = new GoogleFont("Noto Sans JP", { name: "NotoJP", weight: 700, text: allText });
  const fontReg = new GoogleFont("Noto Sans JP", { name: "NotoJP", weight: 400, text: allText });

  const t0 = Date.now();
  const res = await ImageResponse.async(element, {
    width: 1200,
    height: 630,
    format: "png",
    fonts: [fontBold, fontReg],
  });
  const elapsed = Date.now() - t0;
  res.headers.set("X-Render-Time", `${elapsed}ms`);
  res.headers.set("Cache-Control", "public, max-age=86400, s-maxage=86400");
  return res;
};
