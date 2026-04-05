import { AtpAgent } from "@atproto/api";
import type {
  BlueMadoBox,
  BlueMadoKoe,
  BlueMadoAnswer,
  QuestionBox,
  Question,
} from "@/types";
import type { SessionFetch } from "@/lib/oauth";

// Lexicon NSIDs
export const NSID = {
  BOX: "blue.mado.box",
  KOE: "blue.mado.koe",
  ANSWER: "blue.mado.answer",
} as const;

const DEFAULT_PDS = "https://bsky.social";
const APPVIEW_URL = "https://public.api.bsky.app";

/** Unauthenticated agent for public reads via the Bluesky App View. */
function publicAgent(): AtpAgent {
  return new AtpAgent({ service: DEFAULT_PDS });
}

/** Unauthenticated agent for app.bsky.* AppView calls. */
function appViewAgent(): AtpAgent {
  return new AtpAgent({ service: APPVIEW_URL });
}

/**
 * Make an authenticated XRPC call via OAuthSession.fetchHandler.
 *
 * The sessionFetch function is bound to an OAuthSession and handles:
 *   - Constructing the full URL from the PDS base (tokenSet.aud)
 *   - Setting the Authorization header (DPoP or Bearer)
 *   - Attaching the DPoP proof header
 *   - Automatically refreshing the access token if expired
 *
 * pathname is relative to the PDS root, e.g. "/xrpc/com.atproto.repo.createRecord".
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

/**
 * Fetch a user's public profile from the Bluesky App View.
 */
export async function getProfile(handleOrDid: string) {
  const agent = appViewAgent();
  try {
    const res = await agent.getProfile({ actor: handleOrDid });
    return res.data;
  } catch {
    return null;
  }
}

/**
 * Resolve a handle to a DID.
 */
export async function resolveHandle(handle: string): Promise<string | null> {
  if (handle.startsWith("did:")) return handle;
  const agent = publicAgent();
  try {
    const res = await agent.resolveHandle({ handle });
    return res.data.did;
  } catch {
    return null;
  }
}

/**
 * Get the PDS service URL for a DID from the PLC directory.
 */
export async function getPdsUrl(did: string): Promise<string | null> {
  try {
    const res = await fetch(`https://plc.directory/${did}`);
    if (!res.ok) return null;
    const doc = await res.json() as {
      service?: Array<{ id: string; type: string; serviceEndpoint: string }>;
    };
    const pds = doc.service?.find((s) => s.id === "#atproto_pds");
    return pds?.serviceEndpoint ?? null;
  } catch {
    return null;
  }
}

/**
 * Fetch a single box record from a user's PDS.
 */
export async function getBoxRecord(
  did: string,
  rkey: string
): Promise<QuestionBox | null> {
  const agent = publicAgent();
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

/**
 * List all question boxes for a user.
 */
export async function listBoxes(did: string): Promise<QuestionBox[]> {
  const agent = publicAgent();
  try {
    const res = await agent.com.atproto.repo.listRecords({
      repo: did,
      collection: NSID.BOX,
      limit: 100,
    });
    return res.data.records.map((r) => {
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

/**
 * Find a box by its slug for a given user.
 */
export async function findBoxBySlug(
  did: string,
  slug: string
): Promise<QuestionBox | null> {
  const boxes = await listBoxes(did);
  return boxes.find((b) => b.slug === slug) ?? null;
}

/**
 * Fetch a single koe record by rkey.
 */
export async function getKoeRecord(
  did: string,
  rkey: string
): Promise<Question | null> {
  const agent = publicAgent();
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

/**
 * List all questions (koe records) for a user's PDS.
 */
export async function listQuestions(did: string): Promise<Question[]> {
  const agent = publicAgent();
  try {
    const res = await agent.com.atproto.repo.listRecords({
      repo: did,
      collection: NSID.KOE,
      limit: 100,
    });
    return res.data.records.map((r) => {
      const record = r.value as BlueMadoKoe;
      const rkey = r.uri.split("/").pop() ?? "";
      return {
        uri: r.uri,
        cid: r.cid,
        rkey,
        boxUri: record.box,
        encryptedFrom: record.encryptedFrom,
        body: record.body,
        isRead: false, // resolved at page level via Redis.smembers(Keys.read(did))
        createdAt: record.createdAt,
      };
    });
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Authenticated writes — all use OAuthSession.fetchHandler (DPoP + auto-refresh)
// ---------------------------------------------------------------------------

/**
 * Write a new question record to the box owner's PDS.
 *
 * Uses the owner's OAuth session (sessionFetch) — Mado acts on behalf of the
 * owner per spec: "Madoが受け取り手のOAuthトークンを使い、受け取り手のPDSに書き込む".
 */
export async function writeQuestion(params: {
  sessionFetch: SessionFetch;
  ownerDid: string;
  boxUri: string;        // AT-URI: at://ownerDid/blue.mado.box/rkey
  encryptedFrom: string; // base64 ECIES-encrypted sender DID
  body: string;          // plaintext question text
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

/**
 * Write an answer record to the owner's PDS.
 */
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
 * Create an app.bsky.feed.post record on the owner's PDS (crosspost to Bluesky feed).
 * Truncates text to 280 characters if needed.
 */
export async function createBskyPost(params: {
  sessionFetch: SessionFetch;
  ownerDid: string;
  text: string;
}): Promise<{ uri: string; cid: string } | null> {
  const { sessionFetch, ownerDid, text } = params;
  const LIMIT = 280;
  const truncated = text.length > LIMIT ? text.slice(0, LIMIT - 1) + "…" : text;
  try {
    return await xrpc<{ uri: string; cid: string }>({
      sessionFetch,
      method: "POST",
      lexicon: "com.atproto.repo.createRecord",
      body: {
        repo: ownerDid,
        collection: "app.bsky.feed.post",
        record: {
          $type: "app.bsky.feed.post",
          text: truncated,
          createdAt: new Date().toISOString(),
          langs: ["ja"],
        },
      },
    });
  } catch {
    return null;
  }
}

/**
 * Delete a record from the owner's PDS.
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

/**
 * Create a box record on the owner's PDS.
 */
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

/**
 * Update (put) an existing box record on the owner's PDS.
 */
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
  const { sessionFetch, did, rkey, title, description, isOpen, publicKeyHex, slug, createdAt } = params;
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
