import type { RequestHandler } from "./$types";
import { resolveHandle, findBoxBySlug, getProfile } from "$lib/atproto/index.js";
import {
  defaultTheme,
  renderOg,
  escapeHtml,
  truncate,
  fetchImageDataUri,
  logoImg,
  profile,
  type Theme,
} from "$lib/og";

function render(
  t: Theme,
  data: { title: string; name: string; handle: string; avatarUri: string | null }
): string {
  const logo = logoImg(t.accent, 94);
  const prof = profile(t, data.name, "のMado", data.handle, data.avatarUri);
  return (
    `<div style="display:flex;width:100%;height:100%;background:${t.bg};position:relative;font-family:'ZenMaru';">` +
    `<div style="position:absolute;top:30px;left:30px;right:30px;bottom:30px;border:3px solid ${t.lineStrong};border-radius:${t.radius + 4}px;"></div>` +
    `<div style="position:absolute;top:34px;left:34px;right:34px;bottom:34px;display:flex;overflow:hidden;border-radius:${t.radius}px;">` +
    `<div style="display:flex;flex-direction:column;justify-content:space-between;width:360px;background:${t.panel};padding:62px 48px;">` +
    `<div style="display:flex;">${logo}</div>` +
    `<div style="display:flex;flex-direction:column;gap:10px;">` +
    `<span style="font-size:40px;font-weight:700;letter-spacing:-0.02em;color:${t.text};">Mado</span>` +
    `</div>` +
    `</div>` +
    `<div style="display:flex;flex-direction:column;justify-content:center;flex:1;padding:70px 62px 120px;">` +
    `<div style="display:flex;flex-wrap:wrap;font-size:60px;line-height:1.3;font-weight:700;letter-spacing:-0.01em;color:${t.text};">${escapeHtml(data.title)}</div>` +
    `</div>` +
    `</div>` +
    `<div style="position:absolute;right:74px;bottom:66px;display:flex;">${prof}</div>` +
    `</div>`
  );
}

export const GET: RequestHandler = async ({ params, platform }) => {

  const cleanHandle = decodeURIComponent(params.handle).replace(/^@/, "");
  const t = defaultTheme;

  let title = "窓";
  let name = cleanHandle;
  let handle = cleanHandle;
  let avatarUri: string | null = null;

  try {
    const did = await resolveHandle(cleanHandle);
    if (did) {
      const [box, prof] = await Promise.all([findBoxBySlug(did, params.slug), getProfile(did)]);
      if (box?.title) title = box.title;
      if (prof?.handle) handle = prof.handle;
      name = prof?.displayName || prof?.handle || cleanHandle;
      avatarUri = await fetchImageDataUri(prof?.avatar);
    }
  } catch {
  }

  const displayTitle = truncate(title, 44);
  const allText = displayTitle + name + "のMado" + "@" + handle + "Mado";
  return renderOg(render(t, { title: displayTitle, name, handle, avatarUri }), allText, platform?.ctx);
};
