import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { resolveMainBoxRkey } from "$lib/mainBox.js";
import { getProfile, listBoxes } from "$lib/atproto/index.js";
import { requireOwner, requireBox } from "$lib/owner.server.js";
import { boxPath } from "$lib/urls.js";

export const load: PageServerLoad = async ({ parent, params, locals, url }) => {
  const { session } = await parent();
  const { handle: cleanHandle, did } = await requireOwner(params.handle, session);
  if (session?.did !== did) throw redirect(303, boxPath(cleanHandle, params.slug));

  const [box, ownerProfile, overrideRkey, boxes] = await Promise.all([
    requireBox(did, params.slug),
    getProfile(did),
    locals.store!.getMainBoxRkey(did),
    listBoxes(did),
  ]);
  const isMain = box.rkey === resolveMainBoxRkey(boxes, overrideRkey);

  return {
    cleanHandle,
    box,
    ownerProfile,
    isMain,
    origin: url.origin,
  };
};
