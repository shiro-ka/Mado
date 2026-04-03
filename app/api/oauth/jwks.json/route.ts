import { NextResponse } from "next/server";
import { getOAuthClient } from "@/lib/oauth";

/**
 * GET /api/oauth/jwks.json
 *
 * Serves the public JWK Set for this OAuth client.
 * Referenced by the client metadata's jwks_uri field.
 *
 * The PDS uses this to verify client_assertion JWTs signed by Mado,
 * and to validate DPoP proof JWTs.
 *
 * Only public key material is exposed here — private keys never leave the server.
 */
export async function GET() {
  const client = await getOAuthClient();
  return NextResponse.json(client.jwks, {
    headers: { "Cache-Control": "no-store" },
  });
}
