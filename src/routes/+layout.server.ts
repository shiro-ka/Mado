import type { LayoutServerLoad } from "./$types";
import { CloudflareStore } from "$lib/store.js";
import { getSessionEntry } from "$lib/auth.server.js";

export const load: LayoutServerLoad = async ({ cookies, platform }) => {
  const env = platform?.env;
  if (!env) return { session: null, sessionExpiresAt: null };

  const store = new CloudflareStore(env);
  const entry = await getSessionEntry(cookies, store);
  return { session: entry?.session ?? null, sessionExpiresAt: entry?.expiresAt ?? null };
};
