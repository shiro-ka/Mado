import type { PageServerLoad } from "./$types";
import { getProfile } from "$lib/atproto/index.js";
import { buildInbox } from "$lib/inbox.server.js";
import { requireOwner, requireBox } from "$lib/owner.server.js";

export const load: PageServerLoad = async ({ params, locals, url }) => {
  const session = await locals.getSession();
  const { handle: cleanHandle, did } = await requireOwner(params.handle, session);
  const store = locals.store!;

  const isOwner = session?.did === did;
  const [box, ownerProfile, card, ownerRegistered] = await Promise.all([
    requireBox(did, params.slug),
    getProfile(did),
    store.getCardStyle(did),
    isOwner ? true : store.ownerHasAnyDevice(did),
  ]);
  const common = { cleanHandle, box, ownerProfile, origin: url.origin, cardVersion: card?.updatedAt ?? null };

  if (isOwner && session) {
    return { ...common, isOwner: true as const, inbox: buildInbox(store, session, box.rkey) };
  }
  return { ...common, isOwner: false as const, ownerRegistered };
};
