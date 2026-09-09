import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { CloudflareStore } from "$lib/store.js";
import { restoreOAuthSession } from "$lib/oauth.server.js";
import { getViewerFollowsActor } from "$lib/atproto/index.js";
import { getOfficialAccount } from "$lib/notify.server.js";

export const load: PageServerLoad = async ({ parent, platform, cookies }) => {
  const { session } = await parent();
  if (!session) throw redirect(303, "/auth/login");

  const env = platform!.env;
  const store = new CloudflareStore(env);

  const [prefs, official] = await Promise.all([
    store.getNotificationPrefs(session.did),
    getOfficialAccount(env),
  ]);

  // Follow state gates the toggle; only checkable once we know the official DID
  // and can restore the viewer's own session to read their viewer state.
  let following = false;
  if (official) {
    const sessionFetch = await restoreOAuthSession(
      env,
      store,
      session.did,
      session.deviceKey
    );
    if (sessionFetch) {
      following = await getViewerFollowsActor(sessionFetch, official.did);
    }
  }

  return {
    dmEnabled: prefs.dmEnabled,
    official, // { handle, did } | null
    following,
    configured: official !== null,
  };
};
