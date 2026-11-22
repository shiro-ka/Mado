import type { RequestHandler } from "./$types";
import { renderOg, userCardHtml, loadOgOwner } from "$lib/og";
import { truncate } from "$lib/text.js";

export const GET: RequestHandler = async ({ params, platform, locals }) => {
  const owner = await loadOgOwner(params.handle, locals.store);
  const name = truncate(owner.name, 12);
  const allText = name + "の窓" + "@" + owner.handle + "Mado";
  return renderOg(userCardHtml(owner.theme, { name, handle: owner.handle, avatarUri: owner.avatarUri }), allText, platform?.ctx);
};
