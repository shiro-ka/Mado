import { error, redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { resolveMainBoxRkey } from "$lib/mainBox.js";
import { getProfile, listBoxes } from "$lib/atproto/index.js";
import { requireOwner } from "$lib/owner.server.js";
import { boxPath } from "$lib/urls.js";

export const load: PageServerLoad = async ({ params, locals, url }) => {
  const session = await locals.getSession();
  const { handle: cleanHandle, did } = await requireOwner(params.handle, session);
  if (session?.did !== did) throw redirect(303, boxPath(cleanHandle, params.slug));

  const [ownerProfile, overrideRkey, boxes] = await Promise.all([
    getProfile(did),
    locals.store!.getMainBoxRkey(did),
    listBoxes(did),
  ]);
  const box = boxes.find((b) => b.slug === params.slug);
  if (!box) throw error(404, "窓が見つかりません");
  const isMain = box.rkey === resolveMainBoxRkey(boxes, overrideRkey);

  return {
    cleanHandle,
    box,
    ownerProfile,
    isMain,
    origin: url.origin,
  };
};
