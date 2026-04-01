import { NextRequest, NextResponse } from "next/server";
import { getRedis, Keys } from "@/lib/redis";
import { createSession, storeTokens } from "@/lib/auth";
import { getProfile } from "@/lib/atproto";
import type { Session } from "@/types";

/**
 * GET /api/auth/callback
 *
 * OAuth 2.0 callback handler. Exchanges the authorization code for tokens,
 * stores them in Redis, creates a session, and redirects to the dashboard.
 */
export async function GET(request: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const searchParams = request.nextUrl.searchParams;

  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  // Handle authorization errors
  if (error) {
    const params = new URLSearchParams({
      error: "oauth_error",
      message: errorDescription ?? error,
    });
    return NextResponse.redirect(`${appUrl}/auth/login?${params}`);
  }

  if (!code || !state) {
    return NextResponse.redirect(`${appUrl}/auth/login?error=missing_params`);
  }

  try {
    const redis = getRedis();

    // Retrieve and validate the OAuth state
    const oauthState = await redis.get<{
      did: string;
      handle: string;
      redirectAfter: string;
    }>(Keys.oauthState(state));

    if (!oauthState) {
      return NextResponse.redirect(`${appUrl}/auth/login?error=invalid_state`);
    }

    // Delete the state to prevent replay attacks
    await redis.del(Keys.oauthState(state));

    const { did, handle, redirectAfter } = oauthState;

    // TODO: Exchange the authorization code for tokens using @atproto/oauth-client-node
    // const client = await getOAuthClient();
    // const tokens = await client.callback(new URL(request.url));
    // const { accessToken, refreshToken, expiresAt } = tokens;

    // Stub tokens for development
    const now = Date.now();
    const expiresAt = now + 90 * 24 * 60 * 60 * 1000; // 90 days

    const tokens = {
      accessJwt: `stub_access_${did}_${now}`,
      refreshJwt: `stub_refresh_${did}_${now}`,
      expiresAt,
    };

    // Store tokens in Redis
    await storeTokens(did, tokens);

    // Fetch profile for display name / avatar
    const profile = await getProfile(did);

    // Create session
    const session: Session = {
      did,
      handle: profile?.handle ?? handle,
      displayName: profile?.displayName,
      avatar: profile?.avatar,
      accessJwt: tokens.accessJwt,
      expiresAt: tokens.expiresAt,
    };

    await createSession(session);

    return NextResponse.redirect(`${appUrl}${redirectAfter}`);
  } catch (err) {
    console.error("[/api/auth/callback]", err);
    return NextResponse.redirect(`${appUrl}/auth/login?error=server_error`);
  }
}
