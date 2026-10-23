import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { CloudflareStore } from "$lib/store.js";
import { buildInbox } from "$lib/inbox.server.js";

export const load: PageServerLoad = async ({ parent, platform }) => {
  const { session } = await parent();
  if (!session) throw redirect(303, "/?next=/receive");

  const store = new CloudflareStore(platform!.env);
  const prefs = await store.getNotificationPrefs(session.did);

  return {
    dmTouched: prefs.touched,
    inbox: buildInbox(store, session),
  };
};
