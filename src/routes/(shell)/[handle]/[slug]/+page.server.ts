import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { CloudflareStore } from "$lib/store.js";
import { resolveHandle, findBoxBySlug, getProfile } from "$lib/atproto/index.js";
import { buildInbox } from "$lib/inbox.server.js";

export const load: PageServerLoad = async ({ parent, params, platform, url }) => {
  const { session } = await parent();
  const cleanHandle = decodeURIComponent(params.handle).replace(/^@/, "");

  const did = await resolveHandle(cleanHandle);
  if (!did) throw error(404, "窓が見つかりません");

  const env = platform!.env;
  const store = new CloudflareStore(env);

  const isOwner = session?.did === did;

  const [box, ownerProfile, ownerRegistered, card] = await Promise.all([
    findBoxBySlug(did, params.slug),
    getProfile(did),
    store.ownerHasAnyDevice(did),
    store.getCardStyle(did),
  ]);

  if (!box) throw error(404, "窓が見つかりません");

  return {
    cleanHandle,
    box,
    ownerProfile,
    ownerRegistered,
    isOwner,
    inbox: isOwner && session ? buildInbox(store, session, box.rkey) : null,
    origin: url.origin,
    cardVersion: card?.updatedAt ?? null,
  };
};
