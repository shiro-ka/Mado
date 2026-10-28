import type { SentRef } from "../types/index.js";

export interface AppSession {
  did: string;
  handle: string;
  displayName?: string;
  avatar?: string;
  // Per-login device key. Also namespaces this device's atproto OAuth session in
  // KV (`${deviceKey}:${did}`) so each device holds an independent token set and
  // a logout on one device doesn't take down the others. Optional for backward
  // compatibility with sessions minted before per-device login shipped;
  // getSession treats a missing deviceKey as logged out (forces clean re-login).
  deviceKey?: string;
}

interface SessionMeta {
  expiresAt: number; // Unix timestamp (seconds)
}

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
    return (await this.getSessionEntry(sessionId))?.session;
  }

  async getSessionEntry(
    sessionId: string
  ): Promise<{ session: AppSession; expiresAt: number | null } | undefined> {
    const { value, metadata } = await this.env.MADO_SESSION.getWithMetadata<AppSession, SessionMeta>(
      sessionId,
      "json"
    );
    return value ? { session: value, expiresAt: metadata?.expiresAt ?? null } : undefined;
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

  /** The owner's chosen "main box" rkey, or null to use the oldest-box default. */
  async getMainBoxRkey(did: string): Promise<string | null> {
    try {
      const row = await this.env.DB.prepare(
        "SELECT main_box_rkey FROM users WHERE did = ?"
      )
        .bind(did)
        .first<{ main_box_rkey: string | null }>();
      return row?.main_box_rkey ?? null;
    } catch (err) {
      // Most likely the 0003 migration hasn't been applied yet (no such column).
      // Degrade gracefully to the oldest-box default rather than 500 on /@handle.
      console.warn("[getMainBoxRkey] falling back to default (run migration 0003?)", err);
      return null;
    }
  }

  /** Set (or clear, with null) the owner's main-box override. */
  async setMainBoxRkey(did: string, rkey: string | null): Promise<void> {
    await this.env.DB.prepare("UPDATE users SET main_box_rkey = ? WHERE did = ?")
      .bind(rkey, did)
      .run();
  }

  // ── Per-device OAuth session registry (D1) ──────────────────────────────

  /** OAuth-session KV key for a specific device. */
  oauthSessionKey(deviceKey: string, did: string): string {
    return `${deviceKey}:${did}`;
  }

  async addDeviceSession(deviceKey: string, did: string): Promise<void> {
    const now = Math.floor(Date.now() / 1000);
    await this.env.DB.prepare(
      "INSERT OR REPLACE INTO device_sessions (device_key, did, created_at, last_seen) VALUES (?, ?, ?, ?)"
    )
      .bind(deviceKey, did, now, now)
      .run();
  }

  async removeDeviceSession(deviceKey: string): Promise<void> {
    await this.env.DB.prepare("DELETE FROM device_sessions WHERE device_key = ?")
      .bind(deviceKey)
      .run();
  }

  /** All device sessions (device_key + did) — used by the cron sweep. */
  async listDeviceSessions(): Promise<{ deviceKey: string; did: string }[]> {
    const { results } = await this.env.DB.prepare(
      "SELECT device_key, did FROM device_sessions"
    ).all<{ device_key: string; did: string }>();
    return results.map((r: { device_key: string; did: string }) => ({
      deviceKey: r.device_key,
      did: r.did,
    }));
  }

  /** Device keys for a DID (newest-seen first) — find any live device of a box owner. */
  async listDeviceKeysForDid(did: string): Promise<string[]> {
    const { results } = await this.env.DB.prepare(
      "SELECT device_key FROM device_sessions WHERE did = ? ORDER BY last_seen DESC"
    )
      .bind(did)
      .all<{ device_key: string }>();
    return results.map((r: { device_key: string }) => r.device_key);
  }

  /** Whether a DID has at least one registered device session. */
  async ownerHasAnyDevice(did: string): Promise<boolean> {
    const row = await this.env.DB.prepare(
      "SELECT 1 FROM device_sessions WHERE did = ? LIMIT 1"
    )
      .bind(did)
      .first();
    return row !== null;
  }

  /** Count remaining device sessions for a DID (post-cleanup user pruning). */
  async countDeviceSessions(did: string): Promise<number> {
    const row = await this.env.DB.prepare(
      "SELECT COUNT(*) AS n FROM device_sessions WHERE did = ?"
    )
      .bind(did)
      .first<{ n: number }>();
    return row?.n ?? 0;
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

  async listBlocks(ownerDid: string): Promise<string[]> {
    const { results } = await this.env.DB.prepare(
      "SELECT target_did FROM blocks WHERE owner_did = ? ORDER BY blocked_at DESC"
    )
      .bind(ownerDid)
      .all<{ target_did: string }>();
    return results.map((r: { target_did: string }) => r.target_did);
  }

  async isBlocked(ownerDid: string, targetDid: string): Promise<boolean> {
    const row = await this.env.DB.prepare(
      "SELECT 1 FROM blocks WHERE owner_did = ? AND target_did = ?"
    )
      .bind(ownerDid, targetDid)
      .first();
    return row !== null;
  }

  async recordDelivery(d: { ownerDid: string; koeRkey: string; boxRkey: string; senderDid: string; sentAt: string; body: string }): Promise<void> {
    await this.env.DB.prepare(
      `INSERT INTO deliveries (owner_did, koe_rkey, box_rkey, sender_did, sent_at, body) VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT (owner_did, koe_rkey) DO UPDATE SET box_rkey = excluded.box_rkey, sender_did = excluded.sender_did, sent_at = excluded.sent_at, body = excluded.body`
    )
      .bind(d.ownerDid, d.koeRkey, d.boxRkey, d.senderDid, Math.floor(new Date(d.sentAt).getTime() / 1000), d.body)
      .run();
  }

  async getSender(ownerDid: string, koeRkey: string): Promise<string | null> {
    const row = await this.env.DB.prepare(
      "SELECT sender_did FROM deliveries WHERE owner_did = ? AND koe_rkey = ?"
    )
      .bind(ownerDid, koeRkey)
      .first<{ sender_did: string | null }>();
    return row?.sender_did ?? null;
  }

  async listSenders(ownerDid: string): Promise<Map<string, string>> {
    const { results } = await this.env.DB.prepare(
      "SELECT koe_rkey, sender_did FROM deliveries WHERE owner_did = ? AND sender_did IS NOT NULL"
    )
      .bind(ownerDid)
      .all<{ koe_rkey: string; sender_did: string }>();
    return new Map(results.map((r: { koe_rkey: string; sender_did: string }) => [r.koe_rkey, r.sender_did]));
  }

  async markHandled(ownerDid: string, rkey: string): Promise<void> {
    await this.env.DB.prepare(
      `INSERT INTO deliveries (owner_did, koe_rkey, owner_handled_at) VALUES (?, ?, ?)
       ON CONFLICT (owner_did, koe_rkey) DO UPDATE SET owner_handled_at = COALESCE(owner_handled_at, excluded.owner_handled_at)`
    )
      .bind(ownerDid, rkey, Math.floor(Date.now() / 1000))
      .run();
  }

  async isHandled(ownerDid: string, rkey: string): Promise<boolean> {
    const row = await this.env.DB.prepare(
      "SELECT 1 FROM deliveries WHERE owner_did = ? AND koe_rkey = ? AND owner_handled_at IS NOT NULL"
    )
      .bind(ownerDid, rkey)
      .first();
    return row !== null;
  }

  async unmarkHandled(ownerDid: string, rkey: string): Promise<void> {
    await this.env.DB.prepare(
      "UPDATE deliveries SET owner_handled_at = NULL WHERE owner_did = ? AND koe_rkey = ?"
    )
      .bind(ownerDid, rkey)
      .run();
  }

  async deleteDeliveries(ownerDid: string, koeRkeys: string[]): Promise<void> {
    const stmts = koeRkeys.map((rkey) =>
      this.env.DB.prepare("DELETE FROM deliveries WHERE owner_did = ? AND koe_rkey = ?").bind(ownerDid, rkey)
    );
    if (stmts.length > 0) await this.env.DB.batch(stmts);
  }

  async listHandled(ownerDid: string): Promise<string[]> {
    const { results } = await this.env.DB.prepare(
      "SELECT koe_rkey FROM deliveries WHERE owner_did = ? AND owner_handled_at IS NOT NULL"
    )
      .bind(ownerDid)
      .all<{ koe_rkey: string }>();
    return results.map((r: { koe_rkey: string }) => r.koe_rkey);
  }

  async listSent(senderDid: string, limit: number): Promise<SentRef[]> {
    type Row = { owner_did: string; koe_rkey: string; box_rkey: string | null; sent_at: number; body: string; sender_read_at: number | null };
    const { results } = await this.env.DB.prepare(
      "SELECT owner_did, koe_rkey, box_rkey, sent_at, body, sender_read_at FROM deliveries WHERE sender_did = ? AND sent_at IS NOT NULL ORDER BY sent_at DESC LIMIT ?"
    )
      .bind(senderDid, limit)
      .all<Row>();
    return results.map((r: Row) => ({
      ownerDid: r.owner_did,
      koeRkey: r.koe_rkey,
      boxRkey: r.box_rkey,
      sentAt: new Date(r.sent_at * 1000).toISOString(),
      body: r.body,
      readAt: r.sender_read_at === null ? null : new Date(r.sender_read_at * 1000).toISOString(),
    }));
  }

  async markSentRead(senderDid: string, ownerDid: string, koeRkey: string): Promise<void> {
    await this.env.DB.prepare(
      "UPDATE deliveries SET sender_read_at = ? WHERE sender_did = ? AND owner_did = ? AND koe_rkey = ?"
    )
      .bind(Math.floor(Date.now() / 1000), senderDid, ownerDid, koeRkey)
      .run();
  }

  async getNotificationPrefs(did: string): Promise<{ dmEnabled: boolean; touched: boolean }> {
    try {
      const row = await this.env.DB.prepare(
        "SELECT dm_enabled FROM notification_prefs WHERE did = ?"
      )
        .bind(did)
        .first<{ dm_enabled: number }>();
      return { dmEnabled: (row?.dm_enabled ?? 0) === 1, touched: row !== null };
    } catch (err) {
      console.warn(
        "[getNotificationPrefs] falling back to disabled (run migration 0004?)",
        err
      );
      return { dmEnabled: false, touched: true };
    }
  }

  async isDmNotifyEnabled(did: string): Promise<boolean> {
    return (await this.getNotificationPrefs(did)).dmEnabled;
  }

  async setDmNotify(did: string, enabled: boolean): Promise<void> {
    await this.env.DB.prepare(
      `INSERT INTO notification_prefs (did, dm_enabled, updated_at) VALUES (?, ?, ?)
       ON CONFLICT(did) DO UPDATE SET dm_enabled = excluded.dm_enabled, updated_at = excluded.updated_at`
    )
      .bind(did, enabled ? 1 : 0, Math.floor(Date.now() / 1000))
      .run();
  }

  async hitLimit(key: string, windowSeconds: number): Promise<number> {
    const now = Math.floor(Date.now() / 1000);
    const row = await this.env.DB.prepare(
      `INSERT INTO send_limits (key, count, expires_at) VALUES (?1, 1, ?2 + ?3)
       ON CONFLICT (key) DO UPDATE SET
         count = CASE WHEN expires_at <= ?2 THEN 1 ELSE count + 1 END,
         expires_at = CASE WHEN expires_at <= ?2 THEN excluded.expires_at ELSE expires_at END
       RETURNING count`
    )
      .bind(key, now, windowSeconds)
      .first<{ count: number }>();
    return row?.count ?? 1;
  }

  async pruneLimits(): Promise<void> {
    await this.env.DB.prepare("DELETE FROM send_limits WHERE expires_at <= ?")
      .bind(Math.floor(Date.now() / 1000))
      .run();
  }

  async acquireLock(key: string, token: string, ttlSeconds: number): Promise<boolean> {
    const now = Math.floor(Date.now() / 1000);
    const row = await this.env.DB.prepare(
      `INSERT INTO oauth_locks (key, token, expires_at) VALUES (?1, ?2, ?3 + ?4)
       ON CONFLICT (key) DO UPDATE SET token = excluded.token, expires_at = excluded.expires_at
       WHERE oauth_locks.expires_at <= ?3
       RETURNING token`
    )
      .bind(key, token, now, ttlSeconds)
      .first<{ token: string }>();
    return row?.token === token;
  }

  async releaseLock(key: string, token: string): Promise<void> {
    await this.env.DB.prepare("DELETE FROM oauth_locks WHERE key = ? AND token = ?")
      .bind(key, token)
      .run();
  }
}
