import { AtpAgent } from "@atproto/api";
import type {
  BlueMadoBox,
  BlueMadoKoe,
  BlueMadoAnswer,
  QuestionBox,
  Question,
  Answer,
} from "../types/index.js";
import type { SessionFetch } from "./oauth.server.js";

// Lexicon NSIDs
export const NSID = {
  BOX: "blue.mado.box",
  KOE: "blue.mado.koe",
  ANSWER: "blue.mado.answer",
} as const;

const DEFAULT_PDS = "https://bsky.social";
const APPVIEW_URL = "https://public.api.bsky.app";

function publicAgent(): AtpAgent {
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
async function repoAgent(repoDid: string): Promise<AtpAgent> {
  const pds = await getPdsUrl(repoDid);
  return new AtpAgent({ service: pds ?? DEFAULT_PDS });
}

function appViewAgent(): AtpAgent {
  return new AtpAgent({ service: APPVIEW_URL });
}

type RecordScan = Array<{ uri: string; cid: string; value: unknown }>;

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
async function listAllRecords(
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
async function xrpc<T = unknown>(params: {
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

export async function getBoxRecord(
  did: string,
  rkey: string
): Promise<QuestionBox | null> {
  const agent = await repoAgent(did);
  try {
    const res = await agent.com.atproto.repo.getRecord({
      repo: did,
      collection: NSID.BOX,
      rkey,
    });
    const record = res.data.value as BlueMadoBox;
    return {
      uri: res.data.uri,
      cid: res.data.cid ?? "",
      rkey,
      slug: record.slug,
      title: record.title,
      description: record.description,
      isOpen: record.isOpen,
      publicKeyHex: record.publicKeyHex,
      createdAt: record.createdAt,
      ownerDid: did,
    };
  } catch {
    return null;
  }
}

export async function listBoxes(did: string): Promise<QuestionBox[]> {
  const agent = await repoAgent(did);
  try {
    const records = await listAllRecords(agent, did, NSID.BOX);
    return records.map((r) => {
      const record = r.value as BlueMadoBox;
      const rkey = r.uri.split("/").pop() ?? "";
      return {
        uri: r.uri,
        cid: r.cid,
        rkey,
        slug: record.slug,
        title: record.title,
        description: record.description,
        isOpen: record.isOpen,
        publicKeyHex: record.publicKeyHex,
        createdAt: record.createdAt,
        ownerDid: did,
      };
    });
  } catch {
    return [];
  }
}

export async function findBoxBySlug(
  did: string,
  slug: string
): Promise<QuestionBox | null> {
  const boxes = await listBoxes(did);
  return boxes.find((b) => b.slug === slug) ?? null;
}

export async function getKoeRecord(
  did: string,
  rkey: string
): Promise<Question | null> {
  const agent = await repoAgent(did);
  try {
    const res = await agent.com.atproto.repo.getRecord({
      repo: did,
      collection: NSID.KOE,
      rkey,
    });
    const record = res.data.value as BlueMadoKoe;
    return {
      uri: res.data.uri,
      cid: res.data.cid ?? "",
      rkey,
      boxUri: record.box,
      encryptedFrom: record.encryptedFrom,
      body: record.body,
      isRead: false,
      createdAt: record.createdAt,
    };
  } catch {
    return null;
  }
}

export async function listQuestions(did: string): Promise<Question[]> {
  const agent = await repoAgent(did);
  try {
    const records = await listAllRecords(agent, did, NSID.KOE);
    return records.map((r) => {
      const record = r.value as BlueMadoKoe;
      const rkey = r.uri.split("/").pop() ?? "";
      return {
        uri: r.uri,
        cid: r.cid,
        rkey,
        boxUri: record.box,
        encryptedFrom: record.encryptedFrom,
        body: record.body,
        isRead: false,
        createdAt: record.createdAt,
      };
    });
  } catch {
    return [];
  }
}

export async function getAnswersByOwner(
  ownerDid: string
): Promise<Map<string, Answer[]>> {
  const agent = await repoAgent(ownerDid);
  try {
    const records = await listAllRecords(agent, ownerDid, NSID.ANSWER);
    const map = new Map<string, Answer[]>();
    for (const r of records) {
      const record = r.value as BlueMadoAnswer;
      const rkey = r.uri.split("/").pop() ?? "";
      const answer: Answer = {
        uri: r.uri,
        cid: r.cid,
        rkey,
        questionRkey: record.koe.split("/").pop() ?? "",
        body: record.body,
        createdAt: record.createdAt,
      };
      const list = map.get(record.koe) ?? [];
      list.push(answer);
      map.set(record.koe, list);
    }
    return map;
  } catch {
    return new Map();
  }
}

export async function listAnswers(
  ownerDid: string,
  koeUri: string
): Promise<Answer[]> {
  const agent = await repoAgent(ownerDid);
  try {
    const records = await listAllRecords(agent, ownerDid, NSID.ANSWER);
    return records
      .filter((r) => (r.value as BlueMadoAnswer).koe === koeUri)
      .map((r) => {
        const record = r.value as BlueMadoAnswer;
        const rkey = r.uri.split("/").pop() ?? "";
        return {
          uri: r.uri,
          cid: r.cid,
          rkey,
          questionRkey: koeUri.split("/").pop() ?? "",
          body: record.body,
          createdAt: record.createdAt,
        };
      })
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Authenticated writes
// ---------------------------------------------------------------------------

export async function writeQuestion(params: {
  sessionFetch: SessionFetch;
  ownerDid: string;
  boxUri: string;
  encryptedFrom: string;
  body: string;
}): Promise<{ uri: string; cid: string } | null> {
  const { sessionFetch, ownerDid, boxUri, encryptedFrom, body } = params;
  try {
    const record: BlueMadoKoe = {
      $type: NSID.KOE,
      encryptedFrom,
      body,
      box: boxUri,
      createdAt: new Date().toISOString(),
    };
    return await xrpc<{ uri: string; cid: string }>({
      sessionFetch,
      method: "POST",
      lexicon: "com.atproto.repo.createRecord",
      body: { repo: ownerDid, collection: NSID.KOE, record },
    });
  } catch {
    return null;
  }
}

export async function writeAnswer(params: {
  sessionFetch: SessionFetch;
  ownerDid: string;
  koeUri: string;
  body: string;
}): Promise<{ uri: string; cid: string } | null> {
  const { sessionFetch, ownerDid, koeUri, body } = params;
  try {
    const record: BlueMadoAnswer = {
      $type: NSID.ANSWER,
      koe: koeUri,
      body,
      createdAt: new Date().toISOString(),
    };
    return await xrpc<{ uri: string; cid: string }>({
      sessionFetch,
      method: "POST",
      lexicon: "com.atproto.repo.createRecord",
      body: { repo: ownerDid, collection: NSID.ANSWER, record },
    });
  } catch {
    return null;
  }
}

/**
 * Whether the authenticated viewer follows `actorDid`. Reads viewer state from
 * an authenticated getProfile (the PDS proxies the appview), so it must be
 * called with the *viewer's* session, not the box owner's. Non-throwing —
 * returns false on any failure.
 */
export async function getViewerFollowsActor(
  sessionFetch: SessionFetch,
  actorDid: string
): Promise<boolean> {
  try {
    const data = await xrpc<{ viewer?: { following?: string } }>({
      sessionFetch,
      method: "GET",
      lexicon: `app.bsky.actor.getProfile?actor=${encodeURIComponent(actorDid)}`,
    });
    return typeof data.viewer?.following === "string";
  } catch {
    return false;
  }
}

/**
 * Write an app.bsky.graph.follow record to the viewer's repo, following
 * `subjectDid`. Used by the notification opt-in flow so the owner follows the
 * official account (required for the official DM to be delivered).
 */
export async function writeFollow(params: {
  sessionFetch: SessionFetch;
  did: string;
  subjectDid: string;
}): Promise<{ uri: string; cid: string } | null> {
  const { sessionFetch, did, subjectDid } = params;
  try {
    const record = {
      $type: "app.bsky.graph.follow",
      subject: subjectDid,
      createdAt: new Date().toISOString(),
    };
    return await xrpc<{ uri: string; cid: string }>({
      sessionFetch,
      method: "POST",
      lexicon: "com.atproto.repo.createRecord",
      body: { repo: did, collection: "app.bsky.graph.follow", record },
    });
  } catch {
    return null;
  }
}

async function uploadThumb(
  sessionFetch: SessionFetch,
  imageUrl: string
): Promise<unknown | null> {
  try {
    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) return null;
    const data = await imgRes.arrayBuffer();
    const uploadRes = await sessionFetch("/xrpc/com.atproto.repo.uploadBlob", {
      method: "POST",
      headers: { "Content-Type": "image/png" },
      body: data,
    });
    if (!uploadRes.ok) return null;
    const json = (await uploadRes.json()) as { blob: unknown };
    return json.blob;
  } catch {
    return null;
  }
}

export async function createBskyPost(params: {
  sessionFetch: SessionFetch;
  ownerDid: string;
  text: string;
  pageUrl?: string;
  ownerName?: string;
}): Promise<{ uri: string; cid: string } | null> {
  const { sessionFetch, ownerDid, text, pageUrl, ownerName } = params;
  const LIMIT = 280;
  const truncated = text.length > LIMIT ? text.slice(0, LIMIT - 1) + "…" : text;

  const record: Record<string, unknown> = {
    $type: "app.bsky.feed.post",
    text: truncated,
    createdAt: new Date().toISOString(),
    langs: ["ja"],
  };

  if (pageUrl) {
    const ogImageUrl = pageUrl.replace("/@", "/og/@");
    const thumb = await uploadThumb(sessionFetch, ogImageUrl);
    record.embed = {
      $type: "app.bsky.embed.external",
      external: {
        uri: pageUrl,
        // Match the koe page's og:title. The OG image (thumb) already renders
        // the question body, so the description is left empty to avoid a
        // duplicate caption under the card.
        title: ownerName ? `${ownerName} への声 - Mado 半匿名メッセージ` : "Mado 半匿名メッセージ",
        description: "",
        ...(thumb ? { thumb } : {}),
      },
    };
  }

  try {
    return await xrpc<{ uri: string; cid: string }>({
      sessionFetch,
      method: "POST",
      lexicon: "com.atproto.repo.createRecord",
      body: {
        repo: ownerDid,
        collection: "app.bsky.feed.post",
        record,
      },
    });
  } catch {
    return null;
  }
}

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

export async function createBoxRecord(params: {
  sessionFetch: SessionFetch;
  did: string;
  slug: string;
  title: string;
  description?: string;
  isOpen: boolean;
  publicKeyHex: string;
}): Promise<{ uri: string; cid: string; rkey: string } | null> {
  const { sessionFetch, did, slug, title, description, isOpen, publicKeyHex } = params;
  try {
    const record: BlueMadoBox = {
      $type: NSID.BOX,
      slug,
      title,
      description,
      isOpen,
      publicKeyHex,
      createdAt: new Date().toISOString(),
    };
    const res = await xrpc<{ uri: string; cid: string }>({
      sessionFetch,
      method: "POST",
      lexicon: "com.atproto.repo.createRecord",
      body: { repo: did, collection: NSID.BOX, record },
    });
    const rkey = res.uri.split("/").pop() ?? "";
    return { ...res, rkey };
  } catch {
    return null;
  }
}

export async function updateBoxRecord(params: {
  sessionFetch: SessionFetch;
  did: string;
  rkey: string;
  title: string;
  description?: string;
  isOpen: boolean;
  publicKeyHex: string;
  slug: string;
  createdAt: string;
}): Promise<boolean> {
  const { sessionFetch, did, rkey, title, description, isOpen, publicKeyHex, slug, createdAt } =
    params;
  try {
    const record: BlueMadoBox = {
      $type: NSID.BOX,
      slug,
      title,
      description,
      isOpen,
      publicKeyHex,
      createdAt,
    };
    await xrpc({
      sessionFetch,
      method: "POST",
      lexicon: "com.atproto.repo.putRecord",
      body: { repo: did, collection: NSID.BOX, rkey, record },
    });
    return true;
  } catch {
    return false;
  }
}
