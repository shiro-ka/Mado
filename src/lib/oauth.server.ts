import { OAuthClient, AtprotoDohHandleResolver } from "@atproto/oauth-client-node";
import type { AuthorizationServerMetadataCache, DpopNonceCache, ProtectedResourceMetadataCache } from "@atproto/oauth-client-node";
import { JoseKey } from "@atproto/jwk-jose";
import type { CloudflareStore } from "./store.js";
import { appOrigin } from "./api.server.js";
import { edgeGet, edgePut } from "./edgeCache.server.js";

/**
 * A fetch function bound to an OAuthSession.
 * Takes a pathname relative to the PDS (e.g. "/xrpc/com.atproto.repo.createRecord")
 * and returns a Response with DPoP proof + Authorization header handled automatically.
 */
export type SessionFetch = (pathname: string, init?: RequestInit) => Promise<Response>;

// Workers don't support redirect:"error" — transparently rewrite to "manual"
const workerFetch: typeof fetch = (input, init) =>
  init?.redirect === "error"
    ? fetch(input, { ...init, redirect: "manual" })
    : fetch(input, init);

const STORE_RETRIES = 2;
const LOCK_WAIT_MS = 10_000;
const LOCK_RETRY_WAIT_MS = 900;
const STORE_RETRY_WAIT_MS = 1100;

function refreshTokenOf(raw: unknown): string | undefined {
  const token = (raw as { tokenSet?: { refresh_token?: unknown } } | undefined)?.tokenSet?.refresh_token;
  return typeof token === "string" ? token : undefined;
}

async function setWithRetry(store: { set: (k: string, v: unknown) => Promise<void> }, key: string, value: unknown) {
  for (let attempt = 0; ; attempt++) {
    try {
      await store.set(key, value);
      return;
    } catch (err) {
      if (attempt >= STORE_RETRIES) throw err;
      console.warn("[oauth] store write failed, retrying:", err);
      await new Promise((r) => setTimeout(r, STORE_RETRY_WAIT_MS));
    }
  }
}

function wrapDpopStore<T>(
  kind: "session" | "state",
  store: {
    get: (k: string) => Promise<unknown>;
    set: (k: string, v: unknown) => Promise<void>;
    del: (k: string) => Promise<void>;
  },
) {
  const seenRefreshToken = new Map<string, string>();
  return {
    async get(key: string): Promise<T | undefined> {
      const raw = (await store.get(key)) as (Record<string, unknown> & { dpopJwk?: Record<string, unknown> }) | undefined;
      if (!raw) return undefined;
      const token = refreshTokenOf(raw);
      if (token) seenRefreshToken.set(key, token);
      const { dpopJwk, ...rest } = raw;
      if (!dpopJwk) return raw as T;
      const dpopKey = await JoseKey.fromJWK(dpopJwk);
      return { ...rest, dpopKey } as T;
    },
    async set(key: string, value: T & { dpopKey?: { privateJwk?: Record<string, unknown> } }): Promise<void> {
      const { dpopKey, ...rest } = value as Record<string, unknown> & { dpopKey?: { privateJwk?: Record<string, unknown> } };
      let stored: unknown = value;
      if (dpopKey) {
        const dpopJwk = dpopKey.privateJwk;
        if (!dpopJwk) throw new Error("Private DPoP JWK is missing.");
        stored = { ...rest, dpopJwk };
      }
      await setWithRetry(store, key, stored);
      const token = refreshTokenOf(stored);
      if (token) seenRefreshToken.set(key, token);
    },
    async del(key: string): Promise<void> {
      const seen = seenRefreshToken.get(key);
      if (seen) {
        const current = refreshTokenOf(await store.get(key));
        if (current && current !== seen) {
          console.warn(`[oauth] ${kind} delete skipped: refreshed by another request`);
          return;
        }
      }
      seenRefreshToken.delete(key);
      await store.del(key);
      if (kind === "session") console.warn(`[oauth] session deleted: ${seen ? "same refresh token" : "not read in this request"}`);
    },
  };
}

// Parsing the JWK keyset (a JoseKey.fromJWK per key) is async crypto work that
// previously ran on *every* authenticated request — every send / answer / follow
// / box write rebuilds the client from scratch. The keys are static env config,
// so parse once per isolate and reuse. Keyed by the raw JSON so a key rotation
// (changed env) reparses instead of serving a stale set.
let keysetCache: { raw: string; keyset: JoseKey[] } | null = null;

function withKeyOps(jwk: Record<string, unknown>): Record<string, unknown> {
  if (!("use" in jwk)) return jwk;
  const { use, ...rest } = jwk;
  return use === "sig" && !rest.key_ops ? { ...rest, key_ops: ["sign"] } : rest;
}

async function getKeyset(rawKeys: string): Promise<JoseKey[]> {
  if (keysetCache && keysetCache.raw === rawKeys) return keysetCache.keyset;
  const keyset = await Promise.all(
    (JSON.parse(rawKeys) as Record<string, unknown>[]).map((k) => JoseKey.fromJWK(withKeyOps(k)))
  );
  keysetCache = { raw: rawKeys, keyset };
  return keyset;
}

/**
 * Create an OAuthClient per request (Workers are stateless; creation is cheap).
 *
 * Uses the base OAuthClient (not NodeOAuthClient) with:
 *   - AtprotoDohHandleResolver: DNS-over-HTTPS handle resolution
 *   - workerFetch: patches redirect:"error" → "manual"
 *   - Cloudflare-native crypto via Web Crypto API
 */
function memoryCache<V>(ttlMs: number, max: number) {
  const entries = new Map<string, { value: V; at: number }>();
  return {
    get(key: string): V | undefined {
      const entry = entries.get(key);
      if (!entry) return undefined;
      if (Date.now() - entry.at > ttlMs) {
        entries.delete(key);
        return undefined;
      }
      return entry.value;
    },
    set(key: string, value: V): void {
      entries.delete(key);
      entries.set(key, { value, at: Date.now() });
      if (entries.size > max) entries.delete(entries.keys().next().value as string);
    },
    del(key: string): void {
      entries.delete(key);
    },
  };
}

function layeredCache<V>(prefix: string, ttlMs: number, max: number) {
  const memory = memoryCache<V>(ttlMs, max);
  return {
    async get(key: string): Promise<V | undefined> {
      const hit = memory.get(key);
      if (hit !== undefined) return hit;
      const raw = await edgeGet(`${prefix}:${key}`);
      if (raw === null) return undefined;
      try {
        const value = JSON.parse(raw) as V;
        memory.set(key, value);
        return value;
      } catch {
        return undefined;
      }
    },
    async set(key: string, value: V): Promise<void> {
      memory.set(key, value);
      await edgePut(`${prefix}:${key}`, JSON.stringify(value), ttlMs / 1000);
    },
    async del(key: string): Promise<void> {
      memory.del(key);
    },
  };
}

const sharedCaches = {
  dpopNonceCache: layeredCache("oauth-nonce", 60e3, 100) as DpopNonceCache,
  authorizationServerMetadataCache: layeredCache("oauth-as", 600e3, 100) as AuthorizationServerMetadataCache,
  protectedResourceMetadataCache: layeredCache("oauth-pr", 600e3, 100) as ProtectedResourceMetadataCache,
};

export const OAUTH_SCOPE = [
  "atproto",
  "repo:blue.mado.box",
  "repo:blue.mado.koe",
  "repo:blue.mado.answer",
  "repo:app.bsky.feed.post?action=create",
  "repo:app.bsky.graph.follow?action=create",
  "blob:image/*",
  "rpc:app.bsky.actor.getProfile?aud=*",
].join(" ");

export const LEGACY_OAUTH_SCOPE = "atproto transition:generic";

export async function createOAuthClient(
  env: App.Platform["env"],
  store: CloudflareStore,
  deviceKey?: string
): Promise<OAuthClient> {
  const appUrl = appOrigin(env);
  const rawKeys = env.OAUTH_PRIVATE_KEYS ?? "[]";
  const keyset = await getKeyset(rawKeys);

  return new OAuthClient({
    fetch: workerFetch,
    handleResolver: new AtprotoDohHandleResolver({
      dohEndpoint: "https://cloudflare-dns.com/dns-query",
      fetch: workerFetch,
    }),
    responseMode: "query",
    ...sharedCaches,
    runtimeImplementation: {
      createKey: (algs) => JoseKey.generate(algs),
      getRandomValues: (n: number) => crypto.getRandomValues(new Uint8Array(n)) as Uint8Array,
      digest: async (bytes, algorithm) => {
        const name = algorithm.name.toUpperCase().replace(/^SHA/, "SHA-");
        return new Uint8Array(await crypto.subtle.digest(name, bytes as unknown as ArrayBuffer));
      },
      requestLock: async <T>(name: string, fn: () => T | PromiseLike<T>): Promise<T> => {
        const lockKey = deviceKey ? `oauthlock:${deviceKey}:${name}` : `oauthlock:${name}`;
        const token = crypto.randomUUID();
        const deadline = Date.now() + LOCK_WAIT_MS;
        while (Date.now() < deadline) {
          if (await store.acquireLock(lockKey, token, 60)) {
            try {
              return await fn();
            } finally {
              await store.releaseLock(lockKey, token);
            }
          }
          await new Promise((r) => setTimeout(r, LOCK_RETRY_WAIT_MS + Math.floor(Math.random() * 200)));
        }
        return fn();
      },
    },
    clientMetadata: {
      client_id: `${appUrl}/api/oauth/client-metadata.json`,
      client_name: "Mado",
      client_uri: appUrl,
      redirect_uris: [`${appUrl}/api/auth/callback`],
      scope: [...new Set(`${OAUTH_SCOPE} ${LEGACY_OAUTH_SCOPE}`.split(" "))].join(" "),
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
      token_endpoint_auth_method: "private_key_jwt",
      token_endpoint_auth_signing_alg: "ES256",
      application_type: "web",
      dpop_bound_access_tokens: true,
      jwks_uri: `${appUrl}/api/oauth/jwks.json`,
    } as never,
    // Allow HTTP for local dev (wrangler pages dev); https is enforced in prod
    allowHttp: appUrl.startsWith("http://"),
    keyset,
    stateStore: wrapDpopStore("state", {
      get: (k) => store.getOAuthState(k),
      set: (k, v) => store.setOAuthState(k, v),
      del: (k) => store.delOAuthState(k),
    }),
    // atproto keys the session store by `sub` (DID). Namespace it with the
    // per-device key so each device holds an independent token set; without a
    // deviceKey (metadata/login endpoints that never touch the session store)
    // fall back to the bare DID.
    sessionStore: wrapDpopStore("session", {
      get: (k) => store.getOAuthSession(deviceKey ? `${deviceKey}:${k}` : k),
      set: (k, v) => store.setOAuthSession(deviceKey ? `${deviceKey}:${k}` : k, v),
      del: (k) => store.delOAuthSession(deviceKey ? `${deviceKey}:${k}` : k),
    }),
  });
}

/**
 * Restore a stored OAuth session for the given DID.
 * Returns a SessionFetch that handles DPoP proofs and token refresh automatically.
 * Returns null if no valid session exists.
 */
export async function restoreOAuthSession(
  env: App.Platform["env"],
  store: CloudflareStore,
  did: string,
  deviceKey: string | undefined
): Promise<SessionFetch | null> {
  if (!deviceKey) return null;
  try {
    const client = await createOAuthClient(env, store, deviceKey);
    const session = await client.restore(did);
    return session.fetchHandler.bind(session) as SessionFetch;
  } catch {
    return null;
  }
}

/**
 * Restore *any* live OAuth session for a DID, across all of that user's devices.
 * Used for server-side writes to a box owner's repo (questions/send): the sender
 * is on their own device, but the write goes out under the owner's credentials
 * and any of the owner's logged-in devices will do. Tries devices newest-first
 * and returns the first that restores.
 */
export async function restoreAnyOAuthSession(
  env: App.Platform["env"],
  store: CloudflareStore,
  did: string
): Promise<SessionFetch | null> {
  const deviceKeys = await store.listDeviceKeysForDid(did);
  for (const deviceKey of deviceKeys) {
    try {
      const client = await createOAuthClient(env, store, deviceKey);
      const session = await client.restore(did);
      return session.fetchHandler.bind(session) as SessionFetch;
    } catch {
      // Try the next device.
    }
  }
  return null;
}

export type OAuthSessionCheck =
  | { status: "valid" }
  | { status: "revoked" }
  | { status: "error"; error: unknown };

/**
 * Diagnose the stored OAuth session for a DID without mutating anything.
 *
 * Distinguishes a *confirmed* revocation/expiry (safe to delete) from a
 * transient failure (network blip, PDS down, DoH hiccup). Callers such as the
 * cron cleanup must only delete on "revoked" — never on "error" — otherwise one
 * flaky run could wipe valid sessions fleet-wide.
 */
export async function checkOAuthSession(
  env: App.Platform["env"],
  store: CloudflareStore,
  did: string,
  deviceKey: string
): Promise<OAuthSessionCheck> {
  // No stored session at all → definitively gone.
  if (!(await store.hasOAuthSession(store.oauthSessionKey(deviceKey, did))))
    return { status: "revoked" };
  try {
    const client = await createOAuthClient(env, store, deviceKey);
    await client.restore(did);
    return { status: "valid" };
  } catch (err) {
    if (isRevocationError(err)) return { status: "revoked" };
    return { status: "error", error: err };
  }
}

/**
 * True only when an error positively indicates the session/grant is gone
 * (invalid_grant, revoked token, deactivated account). Anything else — network
 * errors, timeouts, 5xx from the PDS — returns false so the caller treats it as
 * transient and leaves the session alone.
 */
function isRevocationError(err: unknown): boolean {
  const text = collectErrorText(err).toLowerCase();
  return (
    text.includes("invalid_grant") ||
    text.includes("invalid_token") ||
    text.includes("invalid_client") ||
    text.includes("revoked") ||
    text.includes("deactivated")
  );
}

function collectErrorText(err: unknown, depth = 0): string {
  if (err == null || depth > 4) return "";
  if (typeof err === "string") return err;
  if (typeof err !== "object") return String(err);
  const e = err as Record<string, unknown>;
  const fields = [e.message, e.error, e.error_description, e.name, e.code]
    .filter((v) => typeof v === "string")
    .join(" ");
  const cause = e.cause ? " " + collectErrorText(e.cause, depth + 1) : "";
  return fields + cause;
}

/**
 * Revoke the stored OAuth session for the given DID.
 * Non-fatal — logs a warning on failure.
 */
export async function endDeviceSession(
  env: App.Platform["env"],
  store: CloudflareStore,
  did: string,
  deviceKey: string
): Promise<void> {
  await revokeOAuthSession(env, store, did, deviceKey);
  await store.forgetDevice(deviceKey, did);
}

export async function revokeOAuthSession(
  env: App.Platform["env"],
  store: CloudflareStore,
  did: string,
  deviceKey: string
): Promise<void> {
  try {
    const client = await createOAuthClient(env, store, deviceKey);
    await client.revoke(did);
  } catch (err) {
    console.warn("[oauth] revoke failed:", err);
  }
}
