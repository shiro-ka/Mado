import type { PageServerLoad } from "./$types";
import { getProfile } from "$lib/atproto/index.js";
import { buildInbox } from "$lib/inbox.server.js";
import { requireOwner, requireBox } from "$lib/owner.server.js";

export const load: PageServerLoad = async ({ parent, params, locals, url }) => {
  const { session } = await parent();
  const { handle: cleanHandle, did } = await requireOwner(params.handle, session);
  const store = locals.store!;
  const isOwner = session?.did === did;

  const [box, ownerProfile, ownerRegistered, card] = await Promise.all([
    requireBox(did, params.slug),
    getProfile(did),
    store.ownerHasAnyDevice(did),
    store.getCardStyle(did),
  ]);

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
