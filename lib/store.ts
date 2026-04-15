/**
 * MadoStore — high-level storage interface.
 *
 * Defined during the Cloudflare migration spike. NOT yet referenced from the
 * production code path (lib/redis.ts remains the live facade). After the
 * verification phase, adapters for both Upstash and Cloudflare (KV + D1) will
 * implement this interface, and the API routes will migrate off lib/redis.ts.
 */

import type { NodeSavedState, NodeSavedSession } from "@atproto/oauth-client-node";

export interface SentRef {
  ownerDid: string;
  koeRkey: string;
  sentAt: string;
}

export interface AppSession {
  did: string;
  handle: string;
  displayName?: string;
  avatar?: string;
}

export interface MadoStore {
  // OAuth
  getOAuthState(key: string): Promise<NodeSavedState | undefined>;
  setOAuthState(key: string, value: NodeSavedState): Promise<void>;
  delOAuthState(key: string): Promise<void>;

  getOAuthSession(did: string): Promise<NodeSavedSession | undefined>;
  setOAuthSession(did: string, value: NodeSavedSession): Promise<void>;
  delOAuthSession(did: string): Promise<void>;

  // App session
  getSession(sessionId: string): Promise<AppSession | undefined>;
  setSession(sessionId: string, value: AppSession, ttlSeconds: number): Promise<void>;
  delSession(sessionId: string): Promise<void>;
  sessionTtl(sessionId: string): Promise<number>;

  // User registry (replaces `smembers mado:users` cron scan)
  addUser(did: string): Promise<void>;
  removeUser(did: string): Promise<void>;
  listUsers(): Promise<string[]>;

  // ECIES key pairs per question box
  getKeyPair(did: string, boxRkey: string): Promise<string | undefined>;
  setKeyPair(did: string, boxRkey: string, privHex: string): Promise<void>;
  delKeyPair(did: string, boxRkey: string): Promise<void>;

  // Blocklist (per owner)
  addBlock(ownerDid: string, targetDid: string): Promise<void>;
  removeBlock(ownerDid: string, targetDid: string): Promise<void>;
  isBlocked(ownerDid: string, targetDid: string): Promise<boolean>;

  // Read state (per owner)
  markRead(ownerDid: string, rkey: string): Promise<void>;
  unmarkRead(ownerDid: string, rkey: string): Promise<void>;
  listRead(ownerDid: string): Promise<string[]>;

  // Sent history (per sender, newest first, capped at 200)
  pushSent(senderDid: string, entry: SentRef, cap: number): Promise<void>;
  listSent(senderDid: string, limit: number): Promise<SentRef[]>;

  // Sent-read (reply-read state per sender)
  markSentRead(senderDid: string, token: string): Promise<void>;
  isSentRead(senderDid: string, token: string): Promise<boolean>;

  // Rate limits (returns the new counter value, with a TTL on first incr)
  incrRate(key: string, ttlSeconds: number): Promise<number>;
}
