import { NextRequest, NextResponse } from "next/server";

/**
 * OAuth callback page route.
 * This simply redirects to the API callback handler.
 * The actual token exchange happens in /api/auth/callback.
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  // Build the API callback URL with the same params
  const callbackUrl = new URL("/api/auth/callback", request.url);
  if (code) callbackUrl.searchParams.set("code", code);
  if (state) callbackUrl.searchParams.set("state", state);
  if (error) callbackUrl.searchParams.set("error", error);
  if (errorDescription)
    callbackUrl.searchParams.set("error_description", errorDescription);

  return NextResponse.redirect(callbackUrl);
}
