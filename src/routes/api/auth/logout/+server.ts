import type { RequestHandler } from "./$types";
import { CloudflareStore } from "$lib/store.js";
import { getSession, destroySession } from "$lib/auth.server.js";
import { revokeOAuthSession } from "$lib/oauth.server.js";

export const POST: RequestHandler = async ({ request, cookies, platform }) => {
  const env = platform!.env;
  const appUrl = env.APP_URL ?? "https://mado.blue";
  const store = new CloudflareStore(env);

  const origin = request.headers.get("origin");
  if (origin && origin !== appUrl) {
    return new Response(null, { status: 403 });
  }

  let switched = false;
  try {
    const session = await getSession(cookies, store);
    if (session?.did && session.deviceKey) {
      await revokeOAuthSession(env, store, session.did, session.deviceKey);
      await store.removeDeviceSession(session.deviceKey);
    }
    switched = await destroySession(cookies, env, store);
  } catch (err) {
    console.error("[/api/auth/logout]", err);
    try {
      switched = await destroySession(cookies, env, store);
    } catch {
    }
  }

  return new Response(null, { status: 303, headers: { Location: switched ? `${appUrl}/receive` : `${appUrl}/` } });
};
