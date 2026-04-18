import { redirect } from "@sveltejs/kit";
import type { LayoutServerLoad } from "./$types";
import { CloudflareStore } from "$lib/store.js";
import { getSession, updateSessionProfile } from "$lib/auth.server.js";
import { getProfile } from "$lib/atproto.js";

export const load: LayoutServerLoad = async ({ cookies, platform }) => {
  const env = platform!.env;
  const store = new CloudflareStore(env);
  let session = await getSession(cookies, store);

  if (!session) {
    throw redirect(303, "/auth/login");
  }

  // Backfill missing profile fields
  if (!session.avatar || !session.displayName || session.handle.startsWith("did:")) {
    const profile = await getProfile(session.did);
    if (profile) {
      await updateSessionProfile(cookies, store, session.did, {
        handle: profile.handle,
        displayName: profile.displayName ?? undefined,
        avatar: profile.avatar ?? undefined,
      });
      session = {
        ...session,
        handle: profile.handle,
        displayName: profile.displayName ?? undefined,
        avatar: profile.avatar ?? undefined,
      };
    }
  }

  return { session };
};
