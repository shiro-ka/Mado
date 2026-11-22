import type { RequestHandler } from "./$types";
import { destroySession } from "$lib/auth.server.js";
import { endDeviceSession } from "$lib/oauth.server.js";
import { appOrigin } from "$lib/api.server.js";

export const POST: RequestHandler = async ({ request, cookies, platform, locals }) => {
  const env = platform!.env;
  const appUrl = appOrigin(env);
  const store = locals.store!;

  const origin = request.headers.get("origin");
  if (origin && origin !== appUrl) {
    return new Response(null, { status: 403 });
  }

  let switched = false;
  try {
    const session = await locals.getSession();
    if (session?.did && session.deviceKey) {
      await endDeviceSession(env, store, session.did, session.deviceKey);
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
