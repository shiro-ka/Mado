import type { RequestHandler } from "./$types";
import { CloudflareStore } from "$lib/store.js";
import { createOAuthClient } from "$lib/oauth.server.js";
import { createSession } from "$lib/auth.server.js";
import { getProfile } from "$lib/atproto.js";

export const GET: RequestHandler = async ({ url, cookies, platform }) => {
  const env = platform!.env;
  const appUrl = env.APP_URL ?? "https://mado.blue";

  const error = url.searchParams.get("error");
  const errorDescription = url.searchParams.get("error_description");

  if (error) {
    const params = new URLSearchParams({
      error: "oauth_error",
      message: errorDescription ?? error,
    });
    return new Response(null, {
      status: 302,
      headers: { Location: `${appUrl}/auth/login?${params}` },
    });
  }

  try {
    const store = new CloudflareStore(env);
    const client = await createOAuthClient(env, store);
    const { session } = await client.callback(url.searchParams);
    const did = session.did;

    const profile = await getProfile(did);
    let handle = profile?.handle;
    if (!handle) {
      try {
        const res = await fetch(
          `https://bsky.social/xrpc/com.atproto.repo.describeRepo?repo=${encodeURIComponent(did)}`
        );
        if (res.ok) {
          const data = (await res.json()) as { handle?: string };
          handle = data.handle;
        }
      } catch {
        // ignore
      }
    }

    const appSession = {
      did,
      handle: handle ?? did,
      displayName: profile?.displayName,
      avatar: profile?.avatar,
    };

    await createSession(cookies, env, store, appSession);
    await store.addUser(did);

    return new Response(null, {
      status: 302,
      headers: { Location: `${appUrl}/dashboard` },
    });
  } catch (err) {
    console.error("[/api/auth/callback]", err);
    return new Response(null, {
      status: 302,
      headers: { Location: `${appUrl}/auth/login?error=oauth_failed` },
    });
  }
};
