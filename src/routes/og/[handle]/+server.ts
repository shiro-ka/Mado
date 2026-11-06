import type { RequestHandler } from "./$types";
import { CloudflareStore } from "$lib/store.js";
import { parseCardStyle, colorsOf } from "$lib/cardStyle.js";
import { resolveHandle, getProfile } from "$lib/atproto/index.js";
import { themeFor, renderOg, truncate, fetchImageDataUri, userCardHtml } from "$lib/og";

export const GET: RequestHandler = async ({ params, platform }) => {
  const cleanHandle = decodeURIComponent(params.handle).replace(/^@/, "");
  let t = themeFor();

  let name = cleanHandle;
  let handle = cleanHandle;
  let avatarUri: string | null = null;

  try {
    const did = await resolveHandle(cleanHandle);
    if (did) {
      const [prof, card] = await Promise.all([
        getProfile(did),
        new CloudflareStore(platform!.env).getCardStyle(did),
      ]);
      t = themeFor(colorsOf(parseCardStyle(card?.style)));
      if (prof?.handle) handle = prof.handle;
      name = prof?.displayName || prof?.handle || cleanHandle;
      avatarUri = await fetchImageDataUri(prof?.avatar);
    }
  } catch {
  }

  const displayName = truncate(name, 12);
  const allText = displayName + "の窓" + "@" + handle + "Mado";
  return renderOg(userCardHtml(t, { name: displayName, handle, avatarUri }), allText, platform?.ctx);
};
