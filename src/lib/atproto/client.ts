import { AtpAgent } from "@atproto/api";
import type { SessionFetch } from "../oauth.server.js";
import { sharedInRequest } from "../requestScope.server.js";

const DEFAULT_PDS = "https://bsky.social";
const APPVIEW_URL = "https://public.api.bsky.app";

export function publicAgent(): AtpAgent {
  return new AtpAgent({ service: DEFAULT_PDS });
}

export async function repoAgent(repoDid: string): Promise<AtpAgent> {
  const pds = await getPdsUrl(repoDid);
  return new AtpAgent({ service: pds ?? DEFAULT_PDS });
}

export function appViewAgent(): AtpAgent {
  return new AtpAgent({ service: APPVIEW_URL });
}

export type RecordScan = Array<{ uri: string; cid: string; value: unknown }>;

const recordScanCache = new Map<string, { records: RecordScan; exp: number }>();
const RECORD_SCAN_TTL_MS = 30 * 1000;
const PAGE_SIZE = 100;

function recordScanKey(repo: string, collection: string): string {
  return `${repo}:${collection}`;
}

export function invalidateRecords(repo: string, collection: string): void {
  recordScanCache.delete(recordScanKey(repo, collection));
}

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
      limit: PAGE_SIZE,
      cursor,
    });
    out.push(...res.data.records);
    cursor = res.data.records.length < PAGE_SIZE ? undefined : res.data.cursor;
  } while (cursor && out.length < hardCap);
  if (cursor) {
    console.warn(
      `[listAllRecords] hardCap ${hardCap} reached for ${collection} in ${repo} — older records not loaded`
    );
  }
  recordScanCache.set(cacheKey, { records: out, exp: Date.now() + RECORD_SCAN_TTL_MS });
  return out;
}

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

const handleDidCache = new Map<string, { did: string; exp: number }>();
const HANDLE_CACHE_TTL_MS = 10 * 60 * 1000;

export function resolveHandle(handle: string): Promise<string | null> {
  if (handle.startsWith("did:")) return Promise.resolve(handle);
  const cached = handleDidCache.get(handle);
  if (cached && cached.exp > Date.now()) return Promise.resolve(cached.did);
  return sharedInRequest(`handle:${handle}`, () => fetchHandleDid(handle));
}

async function fetchHandleDid(handle: string): Promise<string | null> {
  const agent = publicAgent();
  try {
    const res = await agent.resolveHandle({ handle });
    handleDidCache.set(handle, { did: res.data.did, exp: Date.now() + HANDLE_CACHE_TTL_MS });
    return res.data.did;
  } catch {
    return null;
  }
}

const pdsCache = new Map<string, { pds: string; exp: number }>();
const PDS_CACHE_TTL_MS = 60 * 60 * 1000;

function didDocumentUrl(did: string): string {
  if (did.startsWith("did:web:")) {
    const host = decodeURIComponent(did.slice("did:web:".length).split(":")[0]);
    return `https://${host}/.well-known/did.json`;
  }
  return `https://plc.directory/${did}`;
}

export function getPdsUrl(did: string): Promise<string | null> {
  const cached = pdsCache.get(did);
  if (cached && cached.exp > Date.now()) return Promise.resolve(cached.pds);
  return sharedInRequest(`pds:${did}`, () => fetchPdsUrl(did));
}

async function fetchPdsUrl(did: string): Promise<string | null> {
  try {
    const res = await fetch(didDocumentUrl(did));
    if (!res.ok) return null;
    const doc = (await res.json()) as {
      service?: Array<{ id: string; type: string; serviceEndpoint: string }>;
    };
    const pds = doc.service?.find((s) => s.id === "#atproto_pds" || s.id.endsWith("#atproto_pds"))?.serviceEndpoint ?? null;
    if (pds) pdsCache.set(did, { pds, exp: Date.now() + PDS_CACHE_TTL_MS });
    return pds;
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
