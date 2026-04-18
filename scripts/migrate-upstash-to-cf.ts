/**
 * Upstash Redis → Cloudflare D1 migration script
 *
 * Usage:
 *   1. Create scripts/.env with UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN
 *   2. npx tsx scripts/migrate-upstash-to-cf.ts
 *   3. Review the generated scripts/migrate.sql
 *   4. wrangler d1 execute mado --remote --file scripts/migrate.sql
 *
 * What gets migrated:
 *   keypairs (CRITICAL)  → D1 keypairs
 *   users                → D1 users
 *   blocklist            → D1 blocks
 *   read state           → D1 reads
 *   sent history         → D1 sent
 *   sent reads           → D1 sent_reads
 *
 * What gets SKIPPED:
 *   OAuth sessions       → format incompatible (NodeOAuthClient vs wrapDpopStore)
 *   App sessions         → all users re-login once (acceptable)
 */

import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Load env ────────────────────────────────────────────────────────────────

function loadEnv() {
  const envPath = resolve(__dirname, ".env");
  let content: string;
  try {
    content = readFileSync(envPath, "utf-8");
  } catch {
    // Fall back to process.env (e.g. CI)
    return;
  }
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
    process.env[key] = val;
  }
}

loadEnv();

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

if (!UPSTASH_URL || !UPSTASH_TOKEN) {
  console.error("Missing UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN in scripts/.env");
  process.exit(1);
}

// ── Upstash REST helpers ─────────────────────────────────────────────────────

async function upstash<T = unknown>(...args: (string | number)[]): Promise<T> {
  const res = await fetch(`${UPSTASH_URL}/${args.map(encodeURIComponent).join("/")}`, {
    headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
  });
  if (!res.ok) {
    throw new Error(`Upstash error ${res.status}: ${await res.text()}`);
  }
  const json = (await res.json()) as { result: T };
  return json.result;
}

async function keys(pattern: string): Promise<string[]> {
  const result: string[] = [];
  let cursor = "0";
  do {
    const [nextCursor, batch] = await upstash<[string, string[]]>("SCAN", cursor, "MATCH", pattern, "COUNT", "100");
    cursor = nextCursor;
    result.push(...batch);
  } while (cursor !== "0");
  return result;
}

async function get(key: string): Promise<string | null> {
  return upstash<string | null>("GET", key);
}

async function smembers(key: string): Promise<string[]> {
  return upstash<string[]>("SMEMBERS", key);
}

async function lrange(key: string, start: number, stop: number): Promise<string[]> {
  return upstash<string[]>("LRANGE", key, start, stop);
}

// ── SQL helpers ──────────────────────────────────────────────────────────────

function esc(s: string): string {
  return `'${s.replace(/'/g, "''")}'`;
}

const now = Math.floor(Date.now() / 1000);
const lines: string[] = ["-- Mado Upstash → D1 migration", `-- Generated: ${new Date().toISOString()}`, ""];

function sql(stmt: string) {
  lines.push(stmt);
}

// ── Migration steps ──────────────────────────────────────────────────────────

async function migrateUsers() {
  console.log("→ users (mado:users)");
  const dids = await smembers("mado:users");
  if (dids.length === 0) {
    console.log("  (empty)");
    return;
  }
  sql("-- users");
  for (const did of dids) {
    sql(`INSERT OR IGNORE INTO users (did, added_at) VALUES (${esc(did)}, ${now});`);
  }
  sql("");
  console.log(`  ${dids.length} users`);
}

async function migrateKeypairs() {
  console.log("→ keypairs (keypair:*)");
  const allKeys = await keys("keypair:*");
  if (allKeys.length === 0) {
    console.log("  (empty)");
    return;
  }
  sql("-- keypairs (CRITICAL)");
  let count = 0;
  for (const k of allKeys) {
    // key format: keypair:{did}:{boxRkey}
    // did contains colons (did:plc:...) so split from the right
    const withoutPrefix = k.slice("keypair:".length);
    // Find last colon — boxRkey has no colons
    const lastColon = withoutPrefix.lastIndexOf(":");
    if (lastColon === -1) {
      console.warn(`  SKIP malformed key: ${k}`);
      continue;
    }
    const did = withoutPrefix.slice(0, lastColon);
    const boxRkey = withoutPrefix.slice(lastColon + 1);
    const privHex = await get(k);
    if (!privHex) {
      console.warn(`  SKIP null value: ${k}`);
      continue;
    }
    sql(
      `INSERT OR IGNORE INTO keypairs (owner_did, box_rkey, private_hex, created_at) VALUES (${esc(did)}, ${esc(boxRkey)}, ${esc(privHex)}, ${now});`
    );
    count++;
  }
  sql("");
  console.log(`  ${count} keypairs`);
}

async function migrateBlocks() {
  console.log("→ blocks (blocklist:*)");
  const allKeys = await keys("blocklist:*");
  if (allKeys.length === 0) {
    console.log("  (empty)");
    return;
  }
  sql("-- blocks");
  let count = 0;
  for (const k of allKeys) {
    const ownerDid = k.slice("blocklist:".length);
    const targets = await smembers(k);
    for (const targetDid of targets) {
      sql(
        `INSERT OR IGNORE INTO blocks (owner_did, target_did, blocked_at) VALUES (${esc(ownerDid)}, ${esc(targetDid)}, ${now});`
      );
      count++;
    }
  }
  sql("");
  console.log(`  ${count} block entries`);
}

async function migrateReads() {
  console.log("→ reads (read:*)");
  const allKeys = await keys("read:*");
  if (allKeys.length === 0) {
    console.log("  (empty)");
    return;
  }
  sql("-- reads");
  let count = 0;
  for (const k of allKeys) {
    const ownerDid = k.slice("read:".length);
    const rkeys = await smembers(k);
    for (const rkey of rkeys) {
      sql(
        `INSERT OR IGNORE INTO reads (owner_did, rkey, read_at) VALUES (${esc(ownerDid)}, ${esc(rkey)}, ${now});`
      );
      count++;
    }
  }
  sql("");
  console.log(`  ${count} read entries`);
}

interface SentRef {
  ownerDid: string;
  koeRkey: string;
  sentAt: string;
  body: string;
}

async function migrateSent() {
  console.log("→ sent (sent:*)");
  const allKeys = await keys("sent:*");
  if (allKeys.length === 0) {
    console.log("  (empty)");
    return;
  }
  sql("-- sent history");
  let count = 0;
  for (const k of allKeys) {
    const senderDid = k.slice("sent:".length);
    const items = await lrange(k, 0, 199);
    for (const item of items) {
      let ref: SentRef;
      try {
        ref = JSON.parse(item) as SentRef;
      } catch {
        console.warn(`  SKIP malformed sent entry: ${item.slice(0, 60)}`);
        continue;
      }
      const sentAt = Math.floor(new Date(ref.sentAt).getTime() / 1000);
      sql(
        `INSERT OR IGNORE INTO sent (sender_did, owner_did, koe_rkey, sent_at, body) VALUES (${esc(senderDid)}, ${esc(ref.ownerDid)}, ${esc(ref.koeRkey)}, ${sentAt}, ${esc(ref.body)});`
      );
      count++;
    }
  }
  sql("");
  console.log(`  ${count} sent entries`);
}

async function migrateSentReads() {
  console.log("→ sent_reads (sent_read:*)");
  const allKeys = await keys("sent_read:*");
  if (allKeys.length === 0) {
    console.log("  (empty)");
    return;
  }
  sql("-- sent_reads");
  let count = 0;
  for (const k of allKeys) {
    const senderDid = k.slice("sent_read:".length);
    const tokens = await smembers(k);
    for (const token of tokens) {
      sql(
        `INSERT OR IGNORE INTO sent_reads (sender_did, token, read_at) VALUES (${esc(senderDid)}, ${esc(token)}, ${now});`
      );
      count++;
    }
  }
  sql("");
  console.log(`  ${count} sent_read entries`);
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("Mado Upstash → D1 migration\n");

  await migrateUsers();
  await migrateKeypairs();
  await migrateBlocks();
  await migrateReads();
  await migrateSent();
  await migrateSentReads();

  const output = resolve(__dirname, "migrate.sql");
  writeFileSync(output, lines.join("\n") + "\n");
  console.log(`\nSQL written to: ${output}`);
  console.log("Review the file, then run:");
  console.log("  wrangler d1 execute mado --remote --file scripts/migrate.sql");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
