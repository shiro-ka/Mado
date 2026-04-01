import { Redis } from "@upstash/redis";

let _redis: Redis | null = null;

export function getRedis(): Redis {
  if (_redis) return _redis;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    throw new Error(
      "Missing UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN environment variables"
    );
  }

  _redis = new Redis({ url, token });
  return _redis;
}

// Key schema
export const Keys = {
  /**
   * Stores StoredTokens for a user DID.
   * TTL: 90 days
   */
  token: (did: string) => `token:${did}`,

  /**
   * Stores the ECIES private key (hex) for a question box.
   * TTL: forever (until box is deleted)
   */
  keyPair: (did: string, boxRkey: string) => `keypair:${did}:${boxRkey}`,

  /**
   * Stores the blocklist (Set) for a user DID.
   */
  blocklist: (did: string) => `blocklist:${did}`,

  /**
   * Stores session data (JSON) for a session ID.
   * TTL: 30 days
   */
  session: (sessionId: string) => `session:${sessionId}`,

  /**
   * Stores the OAuth state (PKCE verifier etc.) during the auth flow.
   * TTL: 10 minutes
   */
  oauthState: (state: string) => `oauth_state:${state}`,
} as const;

export const TTL = {
  TOKEN: 90 * 24 * 60 * 60, // 90 days in seconds
  SESSION: 30 * 24 * 60 * 60, // 30 days in seconds
  OAUTH_STATE: 10 * 60, // 10 minutes in seconds
} as const;
