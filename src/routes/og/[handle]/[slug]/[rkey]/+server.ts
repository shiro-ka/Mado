import type { RequestHandler } from "./$types";
import { resolveHandle, getKoeRecord } from "$lib/atproto.js";

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
    const last = result[maxLines - 1];
    result[maxLines - 1] = last.slice(0, maxCharsPerLine - 1) + "…";
  }
  return result.length > 0 ? result : ["…"];
}

export const GET: RequestHandler = async ({ params }) => {
  const cleanHandle = decodeURIComponent(params.handle).replace(/^@/, "");

  let questionBody = "";
  try {
    const ownerDid = await resolveHandle(cleanHandle);
    if (ownerDid) {
      const question = await getKoeRecord(ownerDid, params.rkey);
      if (question) {
        questionBody = question.body;
      }
    }
  } catch {
    // fall back to placeholder
  }

  const MAX_CHARS = 22;
  const MAX_LINES = 6;
  const lines = wrapText(questionBody, MAX_CHARS, MAX_LINES);

  const fontSize = 36;
  const lineHeight = 54;
  const textBlockHeight = lines.length * lineHeight;
  const contentCenterY = 360;
  const textStartY = contentCenterY - textBlockHeight / 2 + fontSize;

  const textElements = lines
    .map(
      (line, i) =>
        `  <text x="600" y="${Math.round(textStartY + i * lineHeight)}" text-anchor="middle" font-family="'Hiragino Sans', 'Yu Gothic UI', 'Meiryo', sans-serif" font-size="${fontSize}" fill="#deeeff">${escapeXml(line)}</text>`
    )
    .join("\n");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#060c18"/>
      <stop offset="100%" stop-color="#0b1726"/>
    </linearGradient>
    <linearGradient id="accent-line" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#0085ff" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="#3b82f6" stop-opacity="0.4"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bg)"/>

  <!-- Ambient glow -->
  <ellipse cx="1100" cy="580" rx="300" ry="200" fill="#0085ff" opacity="0.05"/>
  <ellipse cx="100" cy="80" rx="200" ry="150" fill="#3b82f6" opacity="0.04"/>

  <!-- Card -->
  <rect x="64" y="48" width="1072" height="534" rx="24" fill="#101828" stroke="rgba(59,130,246,0.22)" stroke-width="1.5"/>

  <!-- Top accent bar -->
  <rect x="64" y="48" width="1072" height="5" rx="3" fill="url(#accent-line)"/>

  <!-- Window icon -->
  <rect x="104" y="100" width="30" height="24" rx="5" fill="none" stroke="#0085ff" stroke-width="2"/>
  <line x1="104" y1="109" x2="134" y2="109" stroke="#0085ff" stroke-width="1.5"/>
  <line x1="119" y1="109" x2="119" y2="124" stroke="#0085ff" stroke-width="1.5"/>

  <!-- "Mado" logo -->
  <text x="146" y="120" font-family="sans-serif" font-size="26" font-weight="bold" fill="#0085ff">Mado</text>

  <!-- Divider -->
  <line x1="104" y1="148" x2="1096" y2="148" stroke="rgba(59,130,246,0.15)" stroke-width="1"/>

  <!-- "匿名の質問" badge -->
  <rect x="104" y="162" width="108" height="28" rx="14" fill="rgba(0,133,255,0.1)" stroke="rgba(0,133,255,0.28)" stroke-width="1"/>
  <text x="158" y="181" text-anchor="middle" font-family="sans-serif" font-size="13" fill="#7aaac8">匿名の質問</text>

  <!-- Question text -->
${textElements}

  <!-- mado.blue -->
  <text x="1096" y="562" text-anchor="end" font-family="sans-serif" font-size="16" fill="#486882">mado.blue</text>
</svg>`;

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=300, s-maxage=300",
    },
  });
};
