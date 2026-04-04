import { NodeOAuthClient, WebcryptoKey } from "@atproto/oauth-client-node";
import type { NodeSavedSession, NodeSavedState } from "@atproto/oauth-client-node";
import { getRedis } from "@/lib/redis";

// Redis key prefixes for the OAuth library's internal state
const STATE_PREFIX = "oauth:state:";
const SESSION_PREFIX = "oauth:session:";
const STATE_TTL = 10 * 60; // 10 minutes in seconds

/**
 * A fetch function that acts as a proxy to OAuthSession.fetchHandler.
 * Takes a pathname relative to the PDS (e.g. "/xrpc/com.atproto.repo.createRecord")
 * and returns a Response with DPoP proof and Authorization header handled automatically.
 */
export type SessionFetch = (pathname: string, init?: RequestInit) => Promise<Response>;

let _client: NodeOAuthClient | null = null;

/**
 * Returns the singleton NodeOAuthClient, initializing it on first call.
 *
 * The client metadata is served at GET /api/oauth/client-metadata.json (the client_id URL).
 * Public JWKs are served at GET /api/oauth/jwks.json.
 *
 * Required env vars:
 *   NEXT_PUBLIC_APP_URL  — base URL of the app (e.g. https://mado.blue)
 *   OAUTH_PRIVATE_KEYS   — JSON array of private JWK objects (see gen-oauth-keys script)
 */
export async function getOAuthClient(): Promise<NodeOAuthClient> {
  if (_client) return _client;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const keyset = await loadKeyset();
  const redis = getRedis();

  _client = new NodeOAuthClient({
    // Client metadata — also served verbatim at /api/oauth/client-metadata.json
    clientMetadata: {
      client_id: `${appUrl}/api/oauth/client-metadata.json`,
      client_name: "Mado",
      client_uri: appUrl,
      redirect_uris: [`${appUrl}/api/auth/callback`],
      scope: "atproto transition:generic",
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
      token_endpoint_auth_method: "private_key_jwt",
      application_type: "web",
      dpop_bound_access_tokens: true,
      jwks_uri: `${appUrl}/api/oauth/jwks.json`,
    // The Zod schema for OAuthClientMetadataInput has strict URL template-literal
    // types that TypeScript can't infer from runtime strings. The library validates
    // at runtime, so a cast is safe here.
    } as never,
    keyset,

    // OAuth state store — holds short-lived PAR state during the auth flow
    stateStore: {
      async get(key: string): Promise<NodeSavedState | undefined> {
        const val = await redis.get<NodeSavedState>(`${STATE_PREFIX}${key}`);
        return val ?? undefined;
      },
      async set(key: string, val: NodeSavedState): Promise<void> {
        await redis.setex(`${STATE_PREFIX}${key}`, STATE_TTL, val);
      },
      async del(key: string): Promise<void> {
        await redis.del(`${STATE_PREFIX}${key}`);
      },
    },

    // OAuth session store — holds the DPoP key + token set for each user DID
    sessionStore: {
      async get(key: string): Promise<NodeSavedSession | undefined> {
        const val = await redis.get<NodeSavedSession>(`${SESSION_PREFIX}${key}`);
        return val ?? undefined;
      },
      async set(key: string, val: NodeSavedSession): Promise<void> {
        // No TTL — sessions live until the refresh token expires or is revoked
        await redis.set(`${SESSION_PREFIX}${key}`, val);
      },
      async del(key: string): Promise<void> {
        await redis.del(`${SESSION_PREFIX}${key}`);
      },
    },

    // Allow HTTP for local development (no effect in production)
    allowHttp: process.env.NODE_ENV !== "production",
  });

  return _client;
}

/**
 * Load the private JWK keyset from the OAUTH_PRIVATE_KEYS environment variable.
 *
 * If OAUTH_PRIVATE_KEYS is not set, an ephemeral key is generated at startup.
 * WARNING: Ephemeral keys mean all OAuth sessions are invalidated on server restart.
 * Always set OAUTH_PRIVATE_KEYS in production.
 *
 * To generate a stable key:
 *   node -e "
 *     const { JoseKey } = require('@atproto/jwk-jose');
 *     JoseKey.generate(['ES256'], 'mado-key-1').then(k => {
 *       console.log(JSON.stringify([k.privateJwk], null, 2));
 *     });
 *   "
 */
async function loadKeyset() {
  const raw = process.env.OAUTH_PRIVATE_KEYS;
  if (raw) {
    const { JoseKey } = await import("@atproto/jwk-jose");
    const jwks = JSON.parse(raw) as Record<string, unknown>[];
    return await Promise.all(jwks.map((jwk) => JoseKey.fromJWK(jwk)));
  }

  console.warn(
    "[oauth] OAUTH_PRIVATE_KEYS is not set — using an ephemeral key pair. " +
      "All OAuth sessions will be lost on server restart."
  );
  return [await WebcryptoKey.generate(["ES256"], "mado-key")];
}

/**
 * Returns true if a stored OAuth session exists for the given DID.
 * Cheaper than restoreOAuthSession — only checks Redis key existence.
 */
export async function hasOAuthSession(did: string): Promise<boolean> {
  const redis = getRedis();
  const exists = await redis.exists(`${SESSION_PREFIX}${did}`);
  return exists === 1;
}

/**
 * Restore a stored OAuth session for the given DID, returning a fetch function
 * that automatically handles DPoP proofs and token refresh.
 *
 * Returns null if no valid session exists (not logged in, token expired, revoked).
 */
export async function restoreOAuthSession(did: string): Promise<SessionFetch | null> {
  try {
    const client = await getOAuthClient();
    const session = await client.restore(did);
    return session.fetchHandler.bind(session);
  } catch {
    return null;
  }
}

/**
 * Revoke the stored OAuth session for the given DID.
 * Called during logout to invalidate the tokens at the authorization server.
 */
export async function revokeOAuthSession(did: string): Promise<void> {
  try {
    const client = await getOAuthClient();
    await client.revoke(did);
  } catch (err) {
    // Log but don't throw — revocation failures are non-fatal for logout
    console.warn("[oauth] revoke failed:", err);
  }
}
