
export interface SentRef {
  ownerDid: string;
  koeRkey: string;
  sentAt: string;
  body: string;
}

export interface AppSession {
  did: string;
  handle: string;
  displayName?: string;
  avatar?: string;
}

interface SessionMeta {
  expiresAt: number; // Unix timestamp (seconds)
}

/**
 * Cloudflare KV + D1 implementation of Mado's storage layer.
 *
 * KV: OAuth state/session, app session, rate limits
 * D1: User registry, ECIES keypairs, blocklist, reads, sent history
 */
export class CloudflareStore {
  constructor(private env: App.Platform["env"]) {}

  // ── OAuth state (KV, 10-min TTL) ────────────────────────────────────────

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async getOAuthState(key: string): Promise<any> {
    const val = await this.env.OAUTH_STATE.get(key, "json");
    return val ?? undefined;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async setOAuthState(key: string, value: any): Promise<void> {
    await this.env.OAUTH_STATE.put(key, JSON.stringify(value), { expirationTtl: 600 });
  }

  async delOAuthState(key: string): Promise<void> {
    await this.env.OAUTH_STATE.delete(key);
  }

  // ── OAuth session (KV, no TTL — lives until revoked) ────────────────────

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async getOAuthSession(did: string): Promise<any> {
    const val = await this.env.OAUTH_SESSION.get(did, "json");
    return val ?? undefined;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async setOAuthSession(did: string, value: any): Promise<void> {
    await this.env.OAUTH_SESSION.put(did, JSON.stringify(value));
  }

  async delOAuthSession(did: string): Promise<void> {
    await this.env.OAUTH_SESSION.delete(did);
  }

  async hasOAuthSession(did: string): Promise<boolean> {
    const val = await this.env.OAUTH_SESSION.get(did);
    return val !== null;
  }

  // ── App session (KV with TTL + metadata for remaining-TTL queries) ──────

  async getSession(sessionId: string): Promise<AppSession | undefined> {
    const val = await this.env.MADO_SESSION.get<AppSession>(sessionId, "json");
    return val ?? undefined;
  }

  async setSession(sessionId: string, value: AppSession, ttlSeconds: number): Promise<void> {
    const expiresAt = Math.floor(Date.now() / 1000) + ttlSeconds;
    await this.env.MADO_SESSION.put(sessionId, JSON.stringify(value), {
      expirationTtl: ttlSeconds,
      metadata: { expiresAt } satisfies SessionMeta,
    });
  }

  async delSession(sessionId: string): Promise<void> {
    await this.env.MADO_SESSION.delete(sessionId);
  }

  async sessionTtl(sessionId: string): Promise<number> {
    const { metadata } = await this.env.MADO_SESSION.getWithMetadata<
      AppSession,
      SessionMeta
    >(sessionId, "json");
    if (!metadata) return 0;
    return Math.max(0, metadata.expiresAt - Math.floor(Date.now() / 1000));
  }

  // ── User registry (D1) ──────────────────────────────────────────────────

  async addUser(did: string): Promise<void> {
    await this.env.DB.prepare(
      "INSERT OR IGNORE INTO users (did, added_at) VALUES (?, ?)"
    )
      .bind(did, Math.floor(Date.now() / 1000))
      .run();
  }

  async removeUser(did: string): Promise<void> {
    await this.env.DB.prepare("DELETE FROM users WHERE did = ?").bind(did).run();
  }

  async listUsers(): Promise<string[]> {
    const { results } = await this.env.DB.prepare("SELECT did FROM users").all<{
      did: string;
    }>();
    return results.map((r: { did: string }) => r.did);
  }

  // ── ECIES keypairs (D1) ─────────────────────────────────────────────────

  async getKeyPair(did: string, boxRkey: string): Promise<string | undefined> {
    const row = await this.env.DB.prepare(
      "SELECT private_hex FROM keypairs WHERE owner_did = ? AND box_rkey = ?"
    )
      .bind(did, boxRkey)
      .first<{ private_hex: string }>();
    return row?.private_hex;
  }

  async setKeyPair(did: string, boxRkey: string, privHex: string): Promise<void> {
    await this.env.DB.prepare(
      "INSERT OR REPLACE INTO keypairs (owner_did, box_rkey, private_hex, created_at) VALUES (?, ?, ?, ?)"
    )
      .bind(did, boxRkey, privHex, Math.floor(Date.now() / 1000))
      .run();
  }

  async delKeyPair(did: string, boxRkey: string): Promise<void> {
    await this.env.DB.prepare(
      "DELETE FROM keypairs WHERE owner_did = ? AND box_rkey = ?"
    )
      .bind(did, boxRkey)
      .run();
  }

  // ── Blocklist (D1) ──────────────────────────────────────────────────────

  async addBlock(ownerDid: string, targetDid: string): Promise<void> {
    await this.env.DB.prepare(
      "INSERT OR IGNORE INTO blocks (owner_did, target_did, blocked_at) VALUES (?, ?, ?)"
    )
      .bind(ownerDid, targetDid, Math.floor(Date.now() / 1000))
      .run();
  }

  async removeBlock(ownerDid: string, targetDid: string): Promise<void> {
    await this.env.DB.prepare(
      "DELETE FROM blocks WHERE owner_did = ? AND target_did = ?"
    )
      .bind(ownerDid, targetDid)
      .run();
  }

  async isBlocked(ownerDid: string, targetDid: string): Promise<boolean> {
    const row = await this.env.DB.prepare(
      "SELECT 1 FROM blocks WHERE owner_did = ? AND target_did = ?"
    )
      .bind(ownerDid, targetDid)
      .first();
    return row !== null;
  }

  // ── Read state (D1) ─────────────────────────────────────────────────────

  async markRead(ownerDid: string, rkey: string): Promise<void> {
    await this.env.DB.prepare(
      "INSERT OR IGNORE INTO reads (owner_did, rkey, read_at) VALUES (?, ?, ?)"
    )
      .bind(ownerDid, rkey, Math.floor(Date.now() / 1000))
      .run();
  }

  async unmarkRead(ownerDid: string, rkey: string): Promise<void> {
    await this.env.DB.prepare(
      "DELETE FROM reads WHERE owner_did = ? AND rkey = ?"
    )
      .bind(ownerDid, rkey)
      .run();
  }

  async listRead(ownerDid: string): Promise<string[]> {
    const { results } = await this.env.DB.prepare(
      "SELECT rkey FROM reads WHERE owner_did = ?"
    )
      .bind(ownerDid)
      .all<{ rkey: string }>();
    return results.map((r: { rkey: string }) => r.rkey);
  }

  // ── Sent history (D1, newest first, capped at `cap` entries) ────────────

  async pushSent(senderDid: string, entry: SentRef, cap: number): Promise<void> {
    const ts = Math.floor(new Date(entry.sentAt).getTime() / 1000);
    await this.env.DB.prepare(
      "INSERT OR REPLACE INTO sent (sender_did, owner_did, koe_rkey, sent_at, body) VALUES (?, ?, ?, ?, ?)"
    )
      .bind(senderDid, entry.ownerDid, entry.koeRkey, ts, entry.body)
      .run();
    // Trim oldest entries beyond cap
    await this.env.DB.prepare(
      `DELETE FROM sent WHERE sender_did = ? AND rowid NOT IN (
        SELECT rowid FROM sent WHERE sender_did = ? ORDER BY sent_at DESC LIMIT ?
      )`
    )
      .bind(senderDid, senderDid, cap)
      .run();
  }

  async listSent(senderDid: string, limit: number): Promise<SentRef[]> {
    const { results } = await this.env.DB.prepare(
      "SELECT owner_did, koe_rkey, sent_at, body FROM sent WHERE sender_did = ? ORDER BY sent_at DESC LIMIT ?"
    )
      .bind(senderDid, limit)
      .all<{ owner_did: string; koe_rkey: string; sent_at: number; body: string }>();
    return results.map((r: { owner_did: string; koe_rkey: string; sent_at: number; body: string }) => ({
      ownerDid: r.owner_did,
      koeRkey: r.koe_rkey,
      sentAt: new Date(r.sent_at * 1000).toISOString(),
      body: r.body,
    }));
  }

  // ── Sent-read state (D1) ─────────────────────────────────────────────────

  async markSentRead(senderDid: string, token: string): Promise<void> {
    await this.env.DB.prepare(
      "INSERT OR IGNORE INTO sent_reads (sender_did, token, read_at) VALUES (?, ?, ?)"
    )
      .bind(senderDid, token, Math.floor(Date.now() / 1000))
      .run();
  }

  async isSentRead(senderDid: string, token: string): Promise<boolean> {
    const row = await this.env.DB.prepare(
      "SELECT 1 FROM sent_reads WHERE sender_did = ? AND token = ?"
    )
      .bind(senderDid, token)
      .first();
    return row !== null;
  }

  // ── Rate limiting (KV, non-atomic — eventual consistency is acceptable) ──

  async incrRate(key: string, ttlSeconds: number): Promise<number> {
    const existing = await this.env.RATE_LIMIT.get<{ count: number }>(key, "json");
    const count = (existing?.count ?? 0) + 1;
    await this.env.RATE_LIMIT.put(key, JSON.stringify({ count }), {
      expirationTtl: ttlSeconds,
    });
    return count;
  }
}
