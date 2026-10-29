import type { RequestHandler } from "./$types";
import { resolveHandle, findBoxBySlug, getProfile } from "$lib/atproto/index.js";
import { defaultTheme, renderOg, truncate, fetchImageDataUri, boxCardHtml } from "$lib/og";

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
  const allText = displayTitle + name + "の窓" + "@" + handle + "Mado";
  return renderOg(boxCardHtml(t, { title: displayTitle, name, handle, avatarUri }), allText, platform?.ctx);
};
