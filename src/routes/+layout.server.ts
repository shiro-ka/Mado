import type { LayoutServerLoad } from "./$types";
import { CloudflareStore } from "$lib/store.js";
import { getSessionEntry, extendSession } from "$lib/auth.server.js";

export const load: LayoutServerLoad = async ({ cookies, platform }) => {
  const env = platform?.env;
  if (!env) return { session: null, officialHandle: null };

  const store = new CloudflareStore(env);
  const entry = await getSessionEntry(cookies, store);
  if (entry) await extendSession(cookies, env, store, entry);
  return { session: entry?.session ?? null, officialHandle: env.MADO_OFFICIAL_HANDLE ?? null };
};
