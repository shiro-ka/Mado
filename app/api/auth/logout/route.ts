import { NextResponse } from "next/server";
import { destroySession } from "@/lib/auth";

/**
 * POST /api/auth/logout
 *
 * Clears the session cookie and deletes the session from Redis.
 * Redirects to the home page.
 */
export async function POST() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  try {
    await destroySession();
    return NextResponse.redirect(`${appUrl}/`);
  } catch (err) {
    console.error("[/api/auth/logout]", err);
    return NextResponse.redirect(`${appUrl}/`);
  }
}
