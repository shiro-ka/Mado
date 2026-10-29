import type { RequestHandler } from "./$types";
import { resolveHandle, getKoeRecord, findBoxBySlug, getProfile } from "$lib/atproto/index.js";
import {
  defaultTheme,
  renderOg,
  escapeHtml,
  phraseHtml,
  truncate,
  fitVoice,
  fetchImageDataUri,
  brand,
  profile,
  type Theme,
} from "$lib/og";

const FALLBACK_TEXT = "匿名の声が届きました";

function tailImg(t: Theme): string {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="56" height="44" viewBox="0 0 56 44">` +
    `<path d="M0 0 H56 V4 L10 44 L0 4 Z" fill="${t.panel}"/>` +
    `<path d="M0 4 L10 44 L56 4" fill="none" stroke="${t.line}" stroke-width="1.5" stroke-linejoin="round"/>` +
    `</svg>`;
  return `<img src="data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}" width="56" height="44" style="width:56px;height:44px;" />`;
}

function render(
  t: Theme,
  data: { body: string; boxTitle: string; name: string; handle: string; avatarUri: string | null }
): string {
  const tag = data.boxTitle
    ? `<div style="display:flex;"><div style="display:flex;padding:6px 16px;background:${t.item};border-radius:999px;font-size:22px;color:${t.note};">${escapeHtml(data.boxTitle)}</div></div>`
    : "";
  const prof = profile(t, data.name, "への声", data.handle, data.avatarUri);
  return (
    `<div style="display:flex;width:100%;height:100%;background:${t.bg};position:relative;font-family:'ZenMaru';">` +
    `<div style="position:absolute;top:52px;left:66px;display:flex;">${brand(t, 72, 32)}</div>` +
    `<div style="position:absolute;top:168px;left:120px;right:120px;bottom:140px;display:flex;flex-direction:column;background:${t.panel};border:1.5px solid ${t.line};border-radius:${t.radius * 2}px;padding:28px 40px;">` +
    tag +
    `<div style="display:flex;flex:1;align-items:center;">` +
    `<div style="display:flex;flex-wrap:wrap;font-size:${fitVoice(data.body)}px;line-height:1.5;font-weight:700;color:${t.text};">${phraseHtml(data.body)}</div>` +
    `</div>` +
    `</div>` +
    `<div style="position:absolute;left:176px;bottom:100px;display:flex;">${tailImg(t)}</div>` +
    `<div style="position:absolute;right:120px;bottom:40px;display:flex;">${prof}</div>` +
    `</div>`
  );
}

export const GET: RequestHandler = async ({ params, platform }) => {

  const cleanHandle = decodeURIComponent(params.handle).replace(/^@/, "");
  const t = defaultTheme;

  let body = FALLBACK_TEXT;
  let boxTitle = "";
  let name = cleanHandle;
  let handle = cleanHandle;
  let avatarUri: string | null = null;

  try {
    const did = await resolveHandle(cleanHandle);
    if (did) {
      const [koe, box, prof] = await Promise.all([
        getKoeRecord(did, params.rkey),
        findBoxBySlug(did, params.slug),
        getProfile(did),
      ]);
      if (koe?.body) body = koe.body;
      if (box?.title) boxTitle = box.title;
      if (prof?.handle) handle = prof.handle;
      name = prof?.displayName || prof?.handle || cleanHandle;
      avatarUri = await fetchImageDataUri(prof?.avatar);
    }
  } catch {
  }

  const display = truncate(body, 100);
  const displayBoxTitle = truncate(boxTitle, 32);
  const allText = display + displayBoxTitle + name + "への声" + "@" + handle + "Mado";
  return renderOg(render(t, { body: display, boxTitle: displayBoxTitle, name, handle, avatarUri }), allText, platform?.ctx);
};
