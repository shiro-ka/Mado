import type { LayoutServerLoad } from "./$types";
import { CloudflareStore } from "$lib/store.js";
import { getSession } from "$lib/auth.server.js";

export const load: LayoutServerLoad = async ({ cookies, platform }) => {
  const env = platform?.env;
  if (!env) return { session: null };

  const store = new CloudflareStore(env);
  const session = await getSession(cookies, store);
  return { session: session ?? null };
};
