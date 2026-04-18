import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { CloudflareStore } from "$lib/store.js";
import { getSession } from "$lib/auth.server.js";
import { resolveHandle, findBoxBySlug, getProfile } from "$lib/atproto.js";

export const load: PageServerLoad = async ({ params, cookies, platform }) => {
  const cleanHandle = decodeURIComponent(params.handle).replace(/^@/, "");

  const did = await resolveHandle(cleanHandle);
  if (!did) throw error(404, "質問箱が見つかりません");

  const env = platform!.env;
  const store = new CloudflareStore(env);

  const [box, ownerProfile, session, ownerRegistered] = await Promise.all([
    findBoxBySlug(did, params.slug),
    getProfile(did),
    getSession(cookies, store),
    store.hasOAuthSession(did),
  ]);

  if (!box) throw error(404, "質問箱が見つかりません");

  return {
    cleanHandle,
    box,
    ownerProfile,
    session: session ?? null,
    ownerRegistered,
  };
};
