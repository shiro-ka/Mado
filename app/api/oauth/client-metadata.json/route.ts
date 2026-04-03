import { NextResponse } from "next/server";
import { getOAuthClient } from "@/lib/oauth";

/**
 * GET /api/oauth/client-metadata.json
 *
 * Serves the OAuth client metadata document. The URL of this endpoint
 * is used as the client_id in the ATProtocol OAuth flow.
 *
 * The PDS fetches this document to verify the client's identity and
 * retrieve the allowed redirect_uris and other client properties.
 */
export async function GET() {
  const client = await getOAuthClient();
  return NextResponse.json(client.clientMetadata, {
    headers: { "Cache-Control": "no-store" },
  });
}
