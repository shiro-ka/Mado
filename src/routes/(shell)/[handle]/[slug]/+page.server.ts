import type { PageServerLoad } from "./$types";
import { getProfile } from "$lib/atproto/index.js";
import { buildInbox } from "$lib/inbox.server.js";
import { requireOwner, requireBox } from "$lib/owner.server.js";

export const load: PageServerLoad = async ({ params, locals, url }) => {
  const session = await locals.getSession();
  const { handle: cleanHandle, did } = await requireOwner(params.handle, session);
  const store = locals.store!;

  const [box, ownerProfile, card] = await Promise.all([
    requireBox(did, params.slug),
    getProfile(did),
    store.getCardStyle(did),
  ]);
  const common = { cleanHandle, box, ownerProfile, origin: url.origin, cardVersion: card?.updatedAt ?? null };

  if (session?.did === did) {
    return { ...common, isOwner: true as const, inbox: buildInbox(store, session, box.rkey) };
  }
  return { ...common, isOwner: false as const, ownerRegistered: await store.ownerHasAnyDevice(did) };
};
