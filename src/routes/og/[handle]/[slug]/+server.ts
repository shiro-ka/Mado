import type { RequestHandler } from "./$types";
import { resolveHandle, findBoxBySlug, getProfile } from "$lib/atproto/index.js";
import {
  defaultTheme,
  renderOg,
  phraseHtml,
  truncate,
  fetchImageDataUri,
  footer,
  profile,
  type Theme,
} from "$lib/og";

function render(
  t: Theme,
  data: { title: string; name: string; handle: string; avatarUri: string | null }
): string {
  const prof = profile(t, data.name, "のMado", data.handle, data.avatarUri);
  return (
    `<div style="display:flex;width:100%;height:100%;background:${t.bg};position:relative;font-family:'ZenMaru';">` +
    `<div style="position:absolute;top:56px;left:74px;right:74px;bottom:150px;display:flex;align-items:center;">` +
    `<div style="display:flex;flex-wrap:wrap;font-size:68px;line-height:1.3;font-weight:700;letter-spacing:-0.01em;color:${t.text};">${phraseHtml(data.title)}</div>` +
    `</div>` +
    footer(t, prof) +
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
