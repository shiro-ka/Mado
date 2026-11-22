import type { LayoutServerLoad } from "./$types";
import { getSessionEntry, extendSession, listAccounts } from "$lib/auth.server.js";
import type { AppSession } from "$lib/store.js";
import type { ViewerSession } from "$lib/accounts.js";

function viewerOf({ did, handle, displayName, avatar }: AppSession): ViewerSession {
  return { did, handle, displayName, avatar };
}

export const load: LayoutServerLoad = async ({ cookies, platform, locals }) => {
  const env = platform?.env;
  if (!env) return { session: null, accounts: [], officialHandle: null };

  const store = locals.store!;
  const entry = await getSessionEntry(cookies, store);
  if (entry) await extendSession(cookies, env, store, entry);
  return {
    session: entry ? viewerOf(entry.session) : null,
    accounts: entry ? await listAccounts(cookies, env, store) : [],
    officialHandle: env.MADO_OFFICIAL_HANDLE ?? null,
  };
};
