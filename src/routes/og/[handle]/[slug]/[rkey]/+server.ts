import type { RequestHandler } from "./$types";
import { getKoeRecord, findBoxBySlug } from "$lib/atproto/index.js";
import { renderOg, koeCardHtml, loadOgOwner } from "$lib/og";
import { truncate } from "$lib/text.js";

const FALLBACK_TEXT = "匿名の声が届きました";

export const GET: RequestHandler = async ({ params, platform, locals }) => {
  const owner = await loadOgOwner(params.handle, locals.store);
  const [koe, box] = owner.did
    ? await Promise.all([
        getKoeRecord(owner.did, params.rkey).catch(() => null),
        findBoxBySlug(owner.did, params.slug).catch(() => null),
      ])
    : [null, null];
  const body = truncate(koe?.body || FALLBACK_TEXT, 100);
  const boxTitle = truncate(box?.title ?? "", 32);
  const allText = body + boxTitle + owner.name + "への声" + "@" + owner.handle + "Mado";
  return renderOg(
    koeCardHtml(owner.theme, { body, boxTitle, name: owner.name, handle: owner.handle, avatarUri: owner.avatarUri }),
    allText,
    platform?.ctx,
  );
};
