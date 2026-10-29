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
  logoImg,
  wordmark,
  profile,
  type Theme,
} from "$lib/og";

const FALLBACK_TEXT = "匿名の声が届きました";

function render(
  t: Theme,
  data: { body: string; boxTitle: string; name: string; handle: string; avatarUri: string | null }
): string {
  const titleChip = data.boxTitle
    ? `<div style="position:absolute;top:58px;left:74px;z-index:1;display:flex;">` +
      `<div style="display:flex;align-items:center;background:${t.panel};border:1.5px solid ${t.line};border-radius:${t.radius}px;padding:9px 17px;">` +
      `<span style="display:flex;font-size:27px;font-weight:400;color:${t.text};">${escapeHtml(data.boxTitle)}</span>` +
      `</div></div>`
    : "";
  const brand = `<div style="display:flex;align-items:center;gap:14px;">${logoImg(t.accent, 50)}${wordmark(t, 22)}</div>`;
  const prof = profile(t, data.name, "への声", data.handle, data.avatarUri);
  return (
    `<div style="display:flex;width:100%;height:100%;background:${t.bg};position:relative;overflow:hidden;font-family:'ZenMaru';">` +
    titleChip +
    `<div style="position:absolute;top:124px;left:74px;right:74px;bottom:120px;display:flex;align-items:center;justify-content:center;z-index:1;">` +
    `<div style="display:flex;flex-wrap:wrap;justify-content:center;text-align:center;font-size:${fitVoice(data.body)}px;line-height:1.46;font-weight:700;color:${t.text};max-width:1010px;">${phraseHtml(data.body)}</div>` +
    `</div>` +
    `<div style="position:absolute;left:74px;bottom:54px;z-index:1;display:flex;">${brand}</div>` +
    `<div style="position:absolute;right:74px;bottom:54px;z-index:1;display:flex;">${prof}</div>` +
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
