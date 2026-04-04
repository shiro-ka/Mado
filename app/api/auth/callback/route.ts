import { NextRequest, NextResponse } from "next/server";
import { getOAuthClient } from "@/lib/oauth";
import { createSession } from "@/lib/auth";
import { getProfile } from "@/lib/atproto";
import { getRedis, Keys } from "@/lib/redis";
import type { Session } from "@/types";

/**
 * GET /api/auth/callback
 *
 * OAuth 2.0 callback handler. The PDS redirects here after the user authorizes.
 *
 * client.callback() validates the state, exchanges the code for tokens,
 * stores the DPoP key + token set in Redis (via sessionStore), and returns
 * an OAuthSession. We then create our own app-level session (cookie + Redis)
 * for the UI.
 */
export async function GET(request: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const error = request.nextUrl.searchParams.get("error");
  const errorDescription = request.nextUrl.searchParams.get("error_description");

  if (error) {
    const params = new URLSearchParams({
      error: "oauth_error",
      message: errorDescription ?? error,
    });
    return NextResponse.redirect(`${appUrl}/auth/login?${params}`);
  }

  try {
    const client = await getOAuthClient();

    // callback() validates state + PKCE, exchanges the code, and stores the session
    const { session } = await client.callback(request.nextUrl.searchParams);
    const did = session.did;

    // Fetch profile for display info
    const profile = await getProfile(did);

    // Create app-level session (cookie → Redis) — separate from the OAuth session
    const appSession: Session = {
      did,
      handle: profile?.handle ?? did,
      displayName: profile?.displayName,
      avatar: profile?.avatar,
    };

    await createSession(appSession);

    // Track this DID in the registered users set for cron-based session checks
    const redis = getRedis();
    await redis.sadd(Keys.users, did);

    return NextResponse.redirect(`${appUrl}/dashboard`);
  } catch (err) {
    console.error("[/api/auth/callback]", err);
    return NextResponse.redirect(`${appUrl}/auth/login?error=oauth_failed`);
  }
}
