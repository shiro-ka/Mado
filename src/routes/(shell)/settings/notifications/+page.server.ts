import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { restoreOAuthSession } from "$lib/oauth.server.js";
import { getViewerFollowsActor } from "$lib/atproto/index.js";
import { getOfficialAccount } from "$lib/notify.server.js";

export const load: PageServerLoad = async ({ platform, locals }) => {
  const session = await locals.getSession();
  if (!session) throw redirect(303, "/?next=/settings/notifications");

  const env = platform!.env;
  const store = locals.store!;

  const [prefs, official] = await Promise.all([
    store.getNotificationPrefs(session.did),
    getOfficialAccount(env),
  ]);

  let following = false;
  if (official) {
    const sessionFetch = await restoreOAuthSession(env, store, session.did, session.deviceKey);
    if (sessionFetch) {
      following = await getViewerFollowsActor(sessionFetch, official.did);
    }
  }

  return {
    dmEnabled: prefs.dmEnabled,
    official,
    following,
  };
};
