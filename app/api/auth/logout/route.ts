import { NextResponse } from "next/server";
import { getSession, destroySession } from "@/lib/auth";
import { revokeOAuthSession } from "@/lib/oauth";

/**
 * POST /api/auth/logout
 *
 * Revokes the OAuth session at the PDS, then clears the app-level session
 * (cookie + Redis). Redirects to the home page.
 */
export async function POST() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  try {
    // Revoke the OAuth session at the authorization server
    const session = await getSession();
    if (session?.did) {
      await revokeOAuthSession(session.did);
    }

    await destroySession();
    return NextResponse.redirect(`${appUrl}/`);
  } catch (err) {
    console.error("[/api/auth/logout]", err);
    // Still destroy the local session even if revocation failed
    try {
      await destroySession();
    } catch { /* ignore */ }
    return NextResponse.redirect(`${appUrl}/`);
  }
}
