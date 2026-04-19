import type { LayoutServerLoad } from "./$types";
import { CloudflareStore } from "$lib/store.js";
import { getProfile } from "$lib/atproto.js";
import { updateSessionProfile } from "$lib/auth.server.js";

export const load: LayoutServerLoad = async ({ parent, cookies, platform }) => {
  const { session } = await parent();
  if (!session || !platform) return {};

  // Backfill missing profile fields
  if (!session.avatar || !session.displayName || session.handle.startsWith("did:")) {
    const store = new CloudflareStore(platform.env);
    const profile = await getProfile(session.did);
    if (profile) {
      await updateSessionProfile(cookies, store, session.did, {
        handle: profile.handle,
        displayName: profile.displayName ?? undefined,
        avatar: profile.avatar ?? undefined,
      });
      return {
        session: {
          ...session,
          handle: profile.handle,
          displayName: profile.displayName ?? undefined,
          avatar: profile.avatar ?? undefined,
        },
      };
    }
  }

  return {};
};
