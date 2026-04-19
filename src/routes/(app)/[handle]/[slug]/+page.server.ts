import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { CloudflareStore } from "$lib/store.js";
import { resolveHandle, findBoxBySlug, getProfile } from "$lib/atproto.js";

export const load: PageServerLoad = async ({ parent, params, platform }) => {
  const { session } = await parent();
  const cleanHandle = decodeURIComponent(params.handle).replace(/^@/, "");

  const did = await resolveHandle(cleanHandle);
  if (!did) throw error(404, "質問箱が見つかりません");

  const env = platform!.env;
  const store = new CloudflareStore(env);

  const isOwner = session?.did === did;

  const [box, ownerProfile, ownerRegistered] = await Promise.all([
    findBoxBySlug(did, params.slug),
    getProfile(did),
    store.hasOAuthSession(did),
  ]);

  if (!box) throw error(404, "質問箱が見つかりません");

  return {
    cleanHandle,
    box,
    ownerProfile,
    ownerRegistered,
    isOwner,
  };
};
