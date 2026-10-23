import type { RequestHandler } from "./$types";
import { CloudflareStore } from "$lib/store.js";
import { createOAuthClient } from "$lib/oauth.server.js";
import { createSession } from "$lib/auth.server.js";
import { getProfile } from "$lib/atproto/index.js";
import { customAlphabet } from "nanoid";
import { safeNext } from "$lib/loginNext.js";

export const GET: RequestHandler = async ({ url, cookies, platform }) => {
  const env = platform!.env;
  const appUrl = env.APP_URL ?? "https://mado.blue";

  const error = url.searchParams.get("error");
  const errorDescription = url.searchParams.get("error_description");

  if (error) {
    console.error("[/api/auth/callback]", error, errorDescription);
    return new Response(null, {
      status: 302,
      headers: { Location: `${appUrl}/?login_error=1` },
    });
  }

  try {
    const store = new CloudflareStore(env);
    // Mint the device key *before* the token exchange so the OAuth session is
    // persisted under this device's namespace (`${deviceKey}:${did}`).
    const deviceKey = customAlphabet(
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
      32
    )();
    const client = await createOAuthClient(env, store, deviceKey);
    const { session, state } = await client.callback(url.searchParams);
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
      deviceKey,
    };

    await createSession(cookies, env, store, appSession);
    await store.addUser(did);
    await store.addDeviceSession(deviceKey, did);

    return new Response(null, {
      status: 302,
      headers: { Location: `${appUrl}${safeNext(state) ?? "/receive"}` },
    });
  } catch (err) {
    console.error("[/api/auth/callback]", err);
    return new Response(null, {
      status: 302,
      headers: { Location: `${appUrl}/?login_error=1` },
    });
  }
};
