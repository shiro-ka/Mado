import type { RequestHandler } from "./$types";
import { resolveHandle, getKoeRecord } from "$lib/atproto.js";
import { initWasm, Resvg } from "@resvg/resvg-wasm";

let wasmReady: Promise<void> | null = null;

function ensureWasm(origin: string) {
  if (!wasmReady) {
    wasmReady = fetch(`${origin}/resvg.wasm`)
      .then((r) => r.arrayBuffer())
      .then((buf) => initWasm(buf))
      .catch(() => {
        wasmReady = null;
        throw new Error("WASM init failed");
      });
  }
  return wasmReady;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function wrapText(text: string, maxCharsPerLine: number, maxLines: number): string[] {
  const result: string[] = [];
  for (const paragraph of text.split("\n")) {
    if (result.length >= maxLines) break;
    const trimmed = paragraph.trim();
    if (!trimmed) continue;
    let remaining = trimmed;
    while (remaining.length > 0 && result.length < maxLines) {
      result.push(remaining.slice(0, maxCharsPerLine));
      remaining = remaining.slice(maxCharsPerLine);
    }
  }
  if (result.length === maxLines) {
    result[maxLines - 1] = result[maxLines - 1].slice(0, maxCharsPerLine - 1) + "…";
  }
  return result.length > 0 ? result : ["…"];
}

function buildSvg(lines: string[]): string {
  const fontSize = 36;
  const lineHeight = 54;
  const textBlockHeight = lines.length * lineHeight;
  const textStartY = 360 - textBlockHeight / 2 + fontSize;

  const textElements = lines
    .map(
      (line, i) =>
        `  <text x="600" y="${Math.round(textStartY + i * lineHeight)}" text-anchor="middle" font-family="sans-serif" font-size="${fontSize}" fill="#deeeff">${escapeXml(line)}</text>`
    )
    .join("\n");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#060c18"/>
      <stop offset="100%" stop-color="#0b1726"/>
    </linearGradient>
    <linearGradient id="al" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#0085ff" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="#3b82f6" stop-opacity="0.4"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <ellipse cx="1100" cy="580" rx="300" ry="200" fill="#0085ff" opacity="0.05"/>
  <ellipse cx="100" cy="80" rx="200" ry="150" fill="#3b82f6" opacity="0.04"/>
  <rect x="64" y="48" width="1072" height="534" rx="24" fill="#101828" stroke="#1e3a5f" stroke-width="1.5"/>
  <rect x="64" y="48" width="1072" height="5" rx="3" fill="url(#al)"/>
  <rect x="104" y="100" width="30" height="24" rx="5" fill="none" stroke="#0085ff" stroke-width="2"/>
  <line x1="104" y1="109" x2="134" y2="109" stroke="#0085ff" stroke-width="1.5"/>
  <line x1="119" y1="109" x2="119" y2="124" stroke="#0085ff" stroke-width="1.5"/>
  <text x="146" y="120" font-family="sans-serif" font-size="26" font-weight="bold" fill="#0085ff">Mado</text>
  <line x1="104" y1="148" x2="1096" y2="148" stroke="#1e3a5f" stroke-width="1"/>
  <rect x="104" y="162" width="108" height="28" rx="14" fill="#0d2240" stroke="#1e5080" stroke-width="1"/>
  <text x="158" y="181" text-anchor="middle" font-family="sans-serif" font-size="13" fill="#7aaac8">&#x533f;&#x540d;&#x306e;&#x8cea;&#x554f;</text>
${textElements}
  <text x="1096" y="562" text-anchor="end" font-family="sans-serif" font-size="16" fill="#486882">mado.blue</text>
</svg>`;
}

export const GET: RequestHandler = async ({ params, url }) => {
  const origin = url.origin;
  const cleanHandle = decodeURIComponent(params.handle).replace(/^@/, "");

  let questionBody = "";
  try {
    const ownerDid = await resolveHandle(cleanHandle);
    if (ownerDid) {
      const question = await getKoeRecord(ownerDid, params.rkey);
      if (question) questionBody = question.body;
    }
  } catch {
    // fall back to placeholder
  }

  const lines = wrapText(questionBody, 22, 6);
  const svg = buildSvg(lines);

  try {
    await ensureWasm(origin);
    const resvg = new Resvg(svg, { fitTo: { mode: "width", value: 1200 } });
    const rendered = resvg.render();
    const png = rendered.asPng();

    return new Response(png.buffer as ArrayBuffer, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=300, s-maxage=300",
      },
    });
  } catch {
    // WASM failed — return SVG as fallback
    return new Response(svg, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=60",
      },
    });
  }
};
