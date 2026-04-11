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
   * Stores the ECIES private key (hex) for a question box.
   * TTL: forever (until box is deleted)
   */
  keyPair: (did: string, boxRkey: string) => `keypair:${did}:${boxRkey}`,

  /**
   * Stores the blocklist (Set) for a user DID.
   */
  blocklist: (did: string) => `blocklist:${did}`,

  /**
   * Stores a Set of rkeys that the user has read.
   * TTL: none (permanent until deleted)
   */
  read: (did: string) => `read:${did}`,

  /**
   * Rate limit counter: sender → specific box. Limit: 1 per minute.
   * TTL: 60 seconds
   */
  rateBox: (senderDid: string, boxRkey: string) => `rate:box:${senderDid}:${boxRkey}`,

  /**
   * Rate limit counter: sender → all boxes. Limit: 5 per 5 minutes.
   * TTL: 300 seconds
   */
  rateGlobal: (senderDid: string) => `rate:global:${senderDid}`,

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

  /**
   * Set of all registered user DIDs (Mado owners who have completed OAuth).
   * Used by the session-check cron to iterate over all registered users.
   */
  users: "mado:users",

  /**
   * List of SentRef objects for a sender. Newest first (LPUSH).
   * Capped at 200 entries.
   */
  sent: (senderDid: string) => `sent:${senderDid}`,

  /**
   * Set of "ownerDid:koeRkey" strings the sender has read replies for.
   */
  sentRead: (senderDid: string) => `sent_read:${senderDid}`,
} as const;

export const TTL = {
  SESSION: 30 * 24 * 60 * 60, // 30 days in seconds
  OAUTH_STATE: 10 * 60, // 10 minutes in seconds
  RATE_BOX: 60, // 1 minute in seconds
  RATE_GLOBAL: 5 * 60, // 5 minutes in seconds
} as const;
