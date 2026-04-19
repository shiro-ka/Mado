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

function appViewAgent(): AtpAgent {
  return new AtpAgent({ service: APPVIEW_URL });
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

export async function getPdsUrl(did: string): Promise<string | null> {
  try {
    const res = await fetch(`https://plc.directory/${did}`);
    if (!res.ok) return null;
    const doc = (await res.json()) as {
      service?: Array<{ id: string; type: string; serviceEndpoint: string }>;
    };
    const pds = doc.service?.find((s) => s.id === "#atproto_pds");
    return pds?.serviceEndpoint ?? null;
  } catch {
    return null;
  }
}

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
  const agent = publicAgent();
  try {
    const res = await agent.com.atproto.repo.listRecords({
      repo: ownerDid,
      collection: NSID.ANSWER,
      limit: 100,
    });
    const map = new Map<string, Answer[]>();
    for (const r of res.data.records) {
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
  const agent = publicAgent();
  try {
    const res = await agent.com.atproto.repo.listRecords({
      repo: ownerDid,
      collection: NSID.ANSWER,
      limit: 100,
    });
    return res.data.records
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

export async function createBskyPost(params: {
  sessionFetch: SessionFetch;
  ownerDid: string;
  text: string;
  pageUrl?: string;
  questionBody?: string;
}): Promise<{ uri: string; cid: string } | null> {
  const { sessionFetch, ownerDid, text, pageUrl, questionBody } = params;
  const LIMIT = 280;
  const truncated = text.length > LIMIT ? text.slice(0, LIMIT - 1) + "…" : text;

  const record: Record<string, unknown> = {
    $type: "app.bsky.feed.post",
    text: truncated,
    createdAt: new Date().toISOString(),
    langs: ["ja"],
  };

  if (pageUrl) {
    record.embed = {
      $type: "app.bsky.embed.external",
      external: {
        uri: pageUrl,
        title: "匿名の質問",
        description: questionBody ? questionBody.slice(0, 300) : "",
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
