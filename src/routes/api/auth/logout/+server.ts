import type { RequestHandler } from "./$types";
import { CloudflareStore } from "$lib/store.js";
import { getSession, destroySession } from "$lib/auth.server.js";
import { revokeOAuthSession } from "$lib/oauth.server.js";

export const POST: RequestHandler = async ({ cookies, platform }) => {
  const env = platform!.env;
  const appUrl = env.APP_URL ?? "https://mado.blue";
  const store = new CloudflareStore(env);

  try {
    const session = await getSession(cookies, store);
    if (session?.did) {
      await revokeOAuthSession(env, store, session.did);
    }
    await destroySession(cookies, store);
  } catch (err) {
    console.error("[/api/auth/logout]", err);
    try {
      await destroySession(cookies, store);
    } catch {
      // ignore
    }
  }

  return new Response(null, { status: 303, headers: { Location: `${appUrl}/` } });
};
