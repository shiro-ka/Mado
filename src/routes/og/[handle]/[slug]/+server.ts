import type { RequestHandler } from "./$types";
import { CloudflareStore } from "$lib/store.js";
import { parseCardStyle, colorsOf } from "$lib/cardStyle.js";
import { resolveHandle, findBoxBySlug, getProfile } from "$lib/atproto/index.js";
import { themeFor, renderOg, truncate, fetchImageDataUri, boxCardHtml } from "$lib/og";

export const GET: RequestHandler = async ({ params, platform }) => {

  const cleanHandle = decodeURIComponent(params.handle).replace(/^@/, "");
  let t = themeFor();

  let title = "窓";
  let name = cleanHandle;
  let handle = cleanHandle;
  let avatarUri: string | null = null;

  try {
    const did = await resolveHandle(cleanHandle);
    if (did) {
      const [box, prof, card] = await Promise.all([
        findBoxBySlug(did, params.slug),
        getProfile(did),
        new CloudflareStore(platform!.env).getCardStyle(did),
      ]);
      t = themeFor(colorsOf(parseCardStyle(card?.style)));
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
