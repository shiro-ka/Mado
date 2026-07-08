import type { RequestHandler } from "./$types";
import { CloudflareStore } from "$lib/store.js";
import { getSession, destroySession } from "$lib/auth.server.js";
import { revokeOAuthSession } from "$lib/oauth.server.js";

export const POST: RequestHandler = async ({ request, cookies, platform }) => {
  const env = platform!.env;
  const appUrl = env.APP_URL ?? "https://mado.blue";
  const store = new CloudflareStore(env);

  // CSRF guard: this is a bodyless POST, so SvelteKit's form-content-type CSRF
  // check doesn't cover it. A cross-site POST would carry a foreign Origin;
  // reject anything that doesn't match our own origin before revoking (which
  // would otherwise let an attacker force-logout the victim).
  const origin = request.headers.get("origin");
  if (origin && origin !== appUrl) {
    return new Response(null, { status: 403 });
  }

  try {
    const session = await getSession(cookies, store);
    if (session?.did && session.deviceKey) {
      // Per-device logout: revoke and de-register only *this* device, leaving
      // the user's other devices logged in.
      await revokeOAuthSession(env, store, session.did, session.deviceKey);
      await store.removeDeviceSession(session.deviceKey);
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
