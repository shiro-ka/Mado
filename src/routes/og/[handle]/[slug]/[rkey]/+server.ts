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
  footer,
  profile,
  type Theme,
} from "$lib/og";

const FALLBACK_TEXT = "匿名の声が届きました";

function render(
  t: Theme,
  data: { body: string; boxTitle: string; name: string; handle: string; avatarUri: string | null }
): string {
  const header = data.boxTitle
    ? `<div style="display:flex;padding:20px 32px;border-bottom:1.5px solid ${t.line};">` +
      `<span style="display:flex;font-size:26px;color:${t.note};">${escapeHtml(data.boxTitle)}</span>` +
      `</div>`
    : "";
  const prof = profile(t, data.name, "への声", data.handle, data.avatarUri);
  return (
    `<div style="display:flex;width:100%;height:100%;background:${t.bg};position:relative;font-family:'ZenMaru';">` +
    `<div style="position:absolute;top:48px;left:56px;right:56px;bottom:132px;display:flex;flex-direction:column;background:${t.panel};border:1.5px solid ${t.line};border-radius:${t.radius}px;overflow:hidden;">` +
    header +
    `<div style="display:flex;flex:1;align-items:center;justify-content:center;padding:28px 56px;">` +
    `<div style="display:flex;flex-wrap:wrap;justify-content:center;text-align:center;font-size:${fitVoice(data.body)}px;line-height:1.46;font-weight:700;color:${t.text};">${phraseHtml(data.body)}</div>` +
    `</div>` +
    `</div>` +
    footer(t, prof) +
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
