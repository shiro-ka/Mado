import { AtpAgent } from "@atproto/api";
import type { SessionFetch } from "../oauth.server.js";

/* atproto への出入り口。

   ★ここの export は「atproto/ フォルダの中だけで使うもの」を含む。
     現場に見せる面は index.ts が決めている ―― publicAgent / repoAgent / xrpc /
     listAllRecords は index.ts から出していないので、外からは触れない。
   ここが持つのは「どこへ繋ぐか」「同じ読み出しを繰り返さない」「誰なのかを引く」の3つだけで、
   Mado 自身のレコード（blue.mado.*）の形は知らない ―― それは records.ts の仕事。 */

const DEFAULT_PDS = "https://bsky.social";
const APPVIEW_URL = "https://public.api.bsky.app";

export function publicAgent(): AtpAgent {
  return new AtpAgent({ service: DEFAULT_PDS });
}

/**
 * Agent pointed at the repo owner's actual PDS.
 *
 * `com.atproto.repo.*` reads only work against the PDS that hosts the repo,
 * so we resolve the DID's PDS endpoint via plc.directory rather than assuming
 * bsky.social. Falls back to bsky.social if resolution fails. `repo` must be a
 * DID (callers resolve handles first).
 */
export async function repoAgent(repoDid: string): Promise<AtpAgent> {
  const pds = await getPdsUrl(repoDid);
  return new AtpAgent({ service: pds ?? DEFAULT_PDS });
}

export function appViewAgent(): AtpAgent {
  return new AtpAgent({ service: APPVIEW_URL });
}

export type RecordScan = Array<{ uri: string; cid: string; value: unknown }>;

// Short-TTL in-isolate cache for the per-collection PDS scans. Every navigation
// re-lists the same collections (home/receive/マイページ all full-scan BOX/KOE/
// ANSWER), so within a browsing burst this collapses the repeated full-repo
// round-trips — the dominant navigation latency — down to a single scan.
// Deliberately short: a new incoming voice from someone else surfaces within the
// TTL, and the owner's own mutations (send / answer / box CRUD) call
// invalidateRecords() for instant reflection. Per-isolate only (no cross-isolate
// coherence), which is fine for a best-effort read cache over an authoritative
// PDS — the source of truth is always the repo, this just skips redundant reads.
const recordScanCache = new Map<string, { records: RecordScan; exp: number }>();
const RECORD_SCAN_TTL_MS = 30 * 1000;

function recordScanKey(repo: string, collection: string): string {
  return `${repo}:${collection}`;
}

/**
 * Drop the cached scan of `collection` in `repo` so the next read re-fetches it
 * from the PDS. Called by the write endpoints right after they mutate a repo, so
 * the owner sees their own change immediately instead of waiting out the TTL.
 */
export function invalidateRecords(repo: string, collection: string): void {
  recordScanCache.delete(recordScanKey(repo, collection));
}

/**
 * List every record in a collection, following cursors past the 100/page limit.
 * Stops at `hardCap` records as a safety bound against runaway repos.
 *
 * Results are memoized per-isolate for RECORD_SCAN_TTL_MS (see recordScanCache).
 *
 * NOTE: when the cap is hit we now log a warning instead of silently dropping
 * the tail (which previously made older questions/answers just disappear).
 * The real fix for hot repos is to index answers/questions in D1 and query by
 * reference instead of full-scanning the PDS — tracked as a follow-up.
 */
export async function listAllRecords(
  agent: AtpAgent,
  repo: string,
  collection: string,
  hardCap = 3000
): Promise<RecordScan> {
  const cacheKey = recordScanKey(repo, collection);
  const cached = recordScanCache.get(cacheKey);
  if (cached && cached.exp > Date.now()) return cached.records;

  const out: RecordScan = [];
  let cursor: string | undefined;
  do {
    const res = await agent.com.atproto.repo.listRecords({
      repo,
      collection,
      limit: 100,
      cursor,
    });
    out.push(...res.data.records);
    cursor = res.data.cursor;
  } while (cursor && out.length < hardCap);
  if (cursor) {
    console.warn(
      `[listAllRecords] hardCap ${hardCap} reached for ${collection} in ${repo} — older records not loaded`
    );
  }
  recordScanCache.set(cacheKey, { records: out, exp: Date.now() + RECORD_SCAN_TTL_MS });
  return out;
}

/**
 * Make an authenticated XRPC call via OAuthSession.fetchHandler.
 */
export async function xrpc<T = unknown>(params: {
  sessionFetch: SessionFetch;
  method: "GET" | "POST";
  lexicon: string;
  body?: object;
}): Promise<T> {
  const { sessionFetch, method, lexicon, body } = params;
  const res = await sessionFetch(`/xrpc/${lexicon}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`XRPC ${lexicon} failed (${res.status}): ${text}`);
  }
  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Public reads (unauthenticated)
// ---------------------------------------------------------------------------

export async function getProfile(handleOrDid: string) {
  const agent = appViewAgent();
  try {
    const res = await agent.getProfile({ actor: handleOrDid });
    return res.data;
  } catch {
    return null;
  }
}

export async function getProfiles(dids: string[]) {
  const agent = appViewAgent();
  const out = new Map<string, { handle: string; displayName?: string; avatar?: string }>();
  for (let i = 0; i < dids.length; i += 25) {
    try {
      const res = await agent.getProfiles({ actors: dids.slice(i, i + 25) });
      for (const p of res.data.profiles) {
        out.set(p.did, { handle: p.handle, displayName: p.displayName, avatar: p.avatar });
      }
    } catch {
      continue;
    }
  }
  return out;
}

// handle→DID cache. Every page under /[handle]/* resolves the handle over the
// network before it can read anything. Shorter TTL than the PDS cache because a
// handle can be reassigned to a different DID (rename), and we don't want to
// route to a stale identity for long.
const handleDidCache = new Map<string, { did: string; exp: number }>();
const HANDLE_CACHE_TTL_MS = 10 * 60 * 1000; // 10min

export async function resolveHandle(handle: string): Promise<string | null> {
  if (handle.startsWith("did:")) return handle;
  const cached = handleDidCache.get(handle);
  if (cached && cached.exp > Date.now()) return cached.did;
  const agent = publicAgent();
  try {
    const res = await agent.resolveHandle({ handle });
    handleDidCache.set(handle, { did: res.data.did, exp: Date.now() + HANDLE_CACHE_TTL_MS });
    return res.data.did;
  } catch {
    return null;
  }
}

// DID→PDS endpoint cache. A DID's PDS is effectively static, but every repo
// read resolves it via plc.directory — and a single page load resolves the same
// DID 2-3× (listBoxes + listQuestions + getAnswersByOwner …), on every
// navigation. Memoizing in the worker isolate collapses those redundant
// round-trips (the dominant navigation latency). Only successful lookups are
// cached, so a transient plc.directory failure isn't pinned for the whole TTL.
const pdsCache = new Map<string, { pds: string; exp: number }>();
const PDS_CACHE_TTL_MS = 60 * 60 * 1000; // 1h — safe vs. rare PDS migrations

export async function getPdsUrl(did: string): Promise<string | null> {
  const cached = pdsCache.get(did);
  if (cached && cached.exp > Date.now()) return cached.pds;
  try {
    const res = await fetch(`https://plc.directory/${did}`);
    if (!res.ok) return null;
    const doc = (await res.json()) as {
      service?: Array<{ id: string; type: string; serviceEndpoint: string }>;
    };
    const pds = doc.service?.find((s) => s.id === "#atproto_pds")?.serviceEndpoint ?? null;
    if (pds) pdsCache.set(did, { pds, exp: Date.now() + PDS_CACHE_TTL_MS });
    return pds;
  } catch {
    return null;
  }
}

/**
 * Delete any record from the authenticated user's repo. Collection-agnostic, so
 * both blue.mado.* records and app.bsky.* records go through here.
 */
export async function deleteRecord(params: {
  sessionFetch: SessionFetch;
  did: string;
  collection: string;
  rkey: string;
}): Promise<boolean> {
  const { sessionFetch, did, collection, rkey } = params;
  try {
    await xrpc({
      sessionFetch,
      method: "POST",
      lexicon: "com.atproto.repo.deleteRecord",
      body: { repo: did, collection, rkey },
    });
    return true;
  } catch {
    return false;
  }
}
