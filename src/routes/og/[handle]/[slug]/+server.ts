import type { RequestHandler } from "./$types";
import { findBoxBySlug } from "$lib/atproto/index.js";
import { renderOg, boxCardHtml, loadOgOwner } from "$lib/og";
import { truncate } from "$lib/text.js";

export const GET: RequestHandler = async ({ params, platform, locals }) => {
  const owner = await loadOgOwner(params.handle, locals.store);
  const box = owner.did ? await findBoxBySlug(owner.did, params.slug).catch(() => null) : null;
  const title = truncate(box?.title ?? "窓", 44);
  const allText = title + owner.name + "の窓" + "@" + owner.handle + "Mado";
  return renderOg(
    boxCardHtml(owner.theme, { title, name: owner.name, handle: owner.handle, avatarUri: owner.avatarUri }),
    allText,
    platform?.ctx,
  );
};
