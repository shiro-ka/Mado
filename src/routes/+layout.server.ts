import type { LayoutServerLoad } from "./$types";
import { renewSession, listAccounts } from "$lib/auth.server.js";
import type { AppSession } from "$lib/store.js";
import type { ViewerSession } from "$lib/accounts.js";

function viewerOf({ did, handle, displayName, avatar }: AppSession): ViewerSession {
  return { did, handle, displayName, avatar };
}

export const load: LayoutServerLoad = async ({ cookies, platform, locals }) => {
  const env = platform?.env;
  if (!env) return { session: null, accounts: [], officialHandle: null };

  const store = locals.store!;
  const entry = await locals.getSessionEntry();
  const session = entry ? await renewSession(cookies, env, store, entry) : null;
  return {
    session: session ? viewerOf(session) : null,
    accounts: session ? await listAccounts(cookies, env, store, session) : [],
    officialHandle: env.MADO_OFFICIAL_HANDLE ?? null,
  };
};
