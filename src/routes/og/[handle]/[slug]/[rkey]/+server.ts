import type { RequestHandler } from "./$types";
import { CloudflareStore } from "$lib/store.js";
import { parseCardStyle, colorsOf } from "$lib/cardStyle.js";
import { resolveHandle, getKoeRecord, findBoxBySlug, getProfile } from "$lib/atproto/index.js";
import { themeFor, renderOg, truncate, fetchImageDataUri, koeCardHtml } from "$lib/og";

const FALLBACK_TEXT = "匿名の声が届きました";

export const GET: RequestHandler = async ({ params, platform }) => {

  const cleanHandle = decodeURIComponent(params.handle).replace(/^@/, "");
  let t = themeFor();

  let body = FALLBACK_TEXT;
  let boxTitle = "";
  let name = cleanHandle;
  let handle = cleanHandle;
  let avatarUri: string | null = null;

  try {
    const did = await resolveHandle(cleanHandle);
    if (did) {
      const [koe, box, prof, card] = await Promise.all([
        getKoeRecord(did, params.rkey),
        findBoxBySlug(did, params.slug),
        getProfile(did),
        new CloudflareStore(platform!.env).getCardStyle(did),
      ]);
      t = themeFor(colorsOf(parseCardStyle(card?.style)));
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
  return renderOg(koeCardHtml(t, { body: display, boxTitle: displayBoxTitle, name, handle, avatarUri }), allText, platform?.ctx);
};
