import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getOAuthClient } from "@/lib/oauth";

const loginSchema = z.object({
  handle: z.string().min(1).max(255),
});

/**
 * POST /api/auth/login
 *
 * Accepts a Bluesky handle and initiates the ATProtocol OAuth 2.0 flow
 * using @atproto/oauth-client-node (confidential client + DPoP).
 *
 * Returns a redirectUrl to send the browser to the PDS authorization endpoint.
 * The OAuth library stores the PKCE verifier and DPoP key in Redis automatically.
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
    const client = await getOAuthClient();

    // authorize() resolves the handle to a DID, discovers the PDS, initiates PAR,
    // stores state in Redis, and returns the authorization endpoint URL.
    const url = await client.authorize(handle, {
      scope: "atproto transition:generic",
    });

    return NextResponse.json({ redirectUrl: url.toString() });
  } catch (err) {
    console.error("[/api/auth/login]", err);
    const msg = err instanceof Error ? err.message : "";
    // Handle resolution failures surface as network/not-found errors
    if (msg.includes("NXDOMAIN") || msg.includes("resolve") || msg.includes("not found")) {
      return NextResponse.json(
        {
          error: "Handle not found",
          message: "ハンドルが見つかりませんでした。正しいハンドルか確認してください。",
        },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: "Internal server error", message: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}
