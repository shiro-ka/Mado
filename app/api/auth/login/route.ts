import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getRedis, Keys, TTL } from "@/lib/redis";
import { resolveHandle } from "@/lib/atproto";

const loginSchema = z.object({
  handle: z.string().min(1).max(255),
});

/**
 * POST /api/auth/login
 *
 * Accepts a Bluesky handle, resolves the DID, and initiates the
 * ATProtocol OAuth 2.0 PKCE authorization flow.
 *
 * Returns a redirect URL to send the user to the authorization endpoint.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as unknown;
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", message: "ハンドルを正しく入力してください" },
        { status: 400 }
      );
    }

    const { handle } = parsed.data;

    // Resolve the handle to a DID
    const did = await resolveHandle(handle);
    if (!did) {
      return NextResponse.json(
        {
          error: "Handle not found",
          message: `@${handle} は見つかりませんでした。正しいハンドルか確認してください。`,
        },
        { status: 404 }
      );
    }

    // TODO: Initialize @atproto/oauth-client-node
    // and get the actual authorization URL.
    //
    // const client = await getOAuthClient();
    // const { url, state } = await client.authorize(handle, {
    //   scope: "atproto",
    // });
    //
    // Store state in Redis for CSRF protection
    // await redis.setex(Keys.oauthState(state), TTL.OAUTH_STATE, {
    //   did,
    //   handle,
    //   redirectAfter: "/dashboard",
    // });
    //
    // return NextResponse.json({ redirectUrl: url.toString() });

    // Placeholder: redirect to a stub callback for development
    const state = crypto.randomUUID();
    const redis = getRedis();
    await redis.setex(
      Keys.oauthState(state),
      TTL.OAUTH_STATE,
      { did, handle, redirectAfter: "/dashboard" }
    );

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const redirectUrl = `${appUrl}/api/auth/callback?code=dev_stub&state=${state}`;

    return NextResponse.json({ redirectUrl });
  } catch (err) {
    console.error("[/api/auth/login]", err);
    return NextResponse.json(
      { error: "Internal server error", message: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}
