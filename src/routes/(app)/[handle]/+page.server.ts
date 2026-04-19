import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { resolveHandle, getProfile, listBoxes } from "$lib/atproto.js";

export const load: PageServerLoad = async ({ parent, params }) => {
  const { session } = await parent();
  const cleanHandle = decodeURIComponent(params.handle).replace(/^@/, "");

  const did = await resolveHandle(cleanHandle);
  if (!did) throw error(404, "ユーザーが見つかりません");

  const [profile, boxes] = await Promise.all([getProfile(did), listBoxes(did)]);

  const isOwner = session?.did === did;
  const openBoxes = isOwner ? boxes : boxes.filter((b) => b.isOpen);

  return { cleanHandle, did, profile, openBoxes, isOwner };
};
