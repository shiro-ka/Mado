import { z } from "zod";
import type {
  BlueMadoBox,
  BlueMadoKoe,
  BlueMadoAnswer,
  QuestionBox,
  Question,
  Answer,
} from "../../types/index.js";
import type { SessionFetch } from "../oauth.server.js";
import {
  repoAgent,
  listAllRecords,
  invalidateRecords,
  xrpc,
} from "./client.js";
import { byteLength } from "../text.js";
import { NSID, boxUri, rkeyOfUri } from "../urls.js";
export { NSID };

const textWithin = (maxBytes: number) => z.string().refine((v) => byteLength(v) <= maxBytes);
const dateText = z.string().refine((v) => !Number.isNaN(Date.parse(v)));

const boxRecord = z.object({
  slug: textWithin(64),
  title: textWithin(600),
  description: textWithin(1800).optional(),
  isOpen: z.boolean(),
  createdAt: dateText,
});

const koeRecord = z.object({
  box: textWithin(2048),
  body: textWithin(3000),
  createdAt: dateText,
});

const answerRecord = z.object({
  koe: textWithin(2048),
  body: textWithin(6000),
  createdAt: dateText,
});

function refOf(value: unknown, key: "box" | "koe"): string {
  const ref = (value as Record<string, unknown> | null)?.[key];
  return typeof ref === "string" ? ref : "";
}

function toBox(value: unknown, uri: string, cid: string | undefined, did: string): QuestionBox | null {
  const parsed = boxRecord.safeParse(value);
  if (!parsed.success) return null;
  const record = parsed.data;
  return {
    uri,
    cid: cid ?? "",
    rkey: rkeyOfUri(uri),
    slug: record.slug,
    title: record.title,
    description: record.description,
    isOpen: record.isOpen,
    createdAt: record.createdAt,
    ownerDid: did,
  };
}

function toKoe(value: unknown, uri: string, cid: string | undefined): Question | null {
  const parsed = koeRecord.safeParse(value);
  if (!parsed.success) return null;
  const record = parsed.data;
  return {
    uri,
    cid: cid ?? "",
    rkey: rkeyOfUri(uri),
    boxUri: record.box,
    body: record.body,
    createdAt: record.createdAt,
  };
}

function toAnswer(value: unknown, uri: string, cid: string): { koeUri: string; answer: Answer } | null {
  const parsed = answerRecord.safeParse(value);
  if (!parsed.success) return null;
  const record = parsed.data;
  return {
    koeUri: record.koe,
    answer: { uri, cid, rkey: rkeyOfUri(uri), body: record.body, createdAt: record.createdAt },
  };
}

function byCreatedAt(a: { createdAt: string }, b: { createdAt: string }) {
  return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
}

export async function getBoxRecord(did: string, rkey: string): Promise<QuestionBox | null> {
  const agent = await repoAgent(did);
  try {
    const res = await agent.com.atproto.repo.getRecord({ repo: did, collection: NSID.BOX, rkey });
    return toBox(res.data.value, res.data.uri, res.data.cid, did);
  } catch {
    return null;
  }
}

export async function listBoxes(did: string): Promise<QuestionBox[]> {
  const agent = await repoAgent(did);
  try {
    const records = await listAllRecords(agent, did, NSID.BOX);
    return records.flatMap((r) => toBox(r.value, r.uri, r.cid, did) ?? []);
  } catch {
    return [];
  }
}

export async function findBoxBySlug(did: string, slug: string): Promise<QuestionBox | null> {
  const boxes = await listBoxes(did);
  return boxes.find((b) => b.slug === slug) ?? null;
}

export async function isSlugTaken(did: string, slug: string, exceptRkey?: string): Promise<boolean> {
  const boxes = await listBoxes(did);
  return boxes.some((b) => b.slug === slug && b.rkey !== exceptRkey);
}

export async function getKoeRecord(did: string, rkey: string): Promise<Question | null> {
  const agent = await repoAgent(did);
  try {
    const res = await agent.com.atproto.repo.getRecord({ repo: did, collection: NSID.KOE, rkey });
    return toKoe(res.data.value, res.data.uri, res.data.cid);
  } catch {
    return null;
  }
}

export async function listQuestions(did: string, freshAfter = 0): Promise<Question[]> {
  const agent = await repoAgent(did);
  try {
    const records = await listAllRecords(agent, did, NSID.KOE, freshAfter);
    return records.flatMap((r) => toKoe(r.value, r.uri, r.cid) ?? []);
  } catch {
    return [];
  }
}

export async function getAnswersByOwner(ownerDid: string): Promise<Map<string, Answer[]>> {
  const agent = await repoAgent(ownerDid);
  try {
    const records = await listAllRecords(agent, ownerDid, NSID.ANSWER);
    const map = new Map<string, Answer[]>();
    for (const r of records) {
      const found = toAnswer(r.value, r.uri, r.cid);
      if (!found) continue;
      const list = map.get(found.koeUri) ?? [];
      list.push(found.answer);
      map.set(found.koeUri, list);
    }
    for (const list of map.values()) list.sort(byCreatedAt);
    return map;
  } catch {
    return new Map();
  }
}

export async function listAnswers(ownerDid: string, koeUri: string): Promise<Answer[]> {
  return (await getAnswersByOwner(ownerDid)).get(koeUri) ?? [];
}

async function createRecord(
  sessionFetch: SessionFetch,
  did: string,
  collection: string,
  record: unknown,
): Promise<{ uri: string; cid: string }> {
  const res = await xrpc<{ uri: string; cid: string }>({
    sessionFetch,
    method: "POST",
    lexicon: "com.atproto.repo.createRecord",
    body: { repo: did, collection, record },
  });
  invalidateRecords(did, collection);
  return res;
}

export async function writeQuestion(params: {
  sessionFetch: SessionFetch;
  ownerDid: string;
  boxUri: string;
  body: string;
}): Promise<{ uri: string; cid: string } | null> {
  const { sessionFetch, ownerDid, boxUri, body } = params;
  try {
    const record: BlueMadoKoe = {
      $type: NSID.KOE,
      body,
      box: boxUri,
      createdAt: new Date().toISOString(),
    };
    return await createRecord(sessionFetch, ownerDid, NSID.KOE, record);
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
    return await createRecord(sessionFetch, ownerDid, NSID.ANSWER, record);
  } catch {
    return null;
  }
}

export async function createBoxRecord(params: {
  sessionFetch: SessionFetch;
  did: string;
  slug: string;
  title: string;
  description?: string;
  isOpen: boolean;
}): Promise<{ uri: string; cid: string; rkey: string } | null> {
  const { sessionFetch, did, slug, title, description, isOpen } = params;
  try {
    const record: BlueMadoBox = {
      $type: NSID.BOX,
      slug,
      title,
      description,
      isOpen,
      createdAt: new Date().toISOString(),
    };
    const res = await createRecord(sessionFetch, did, NSID.BOX, record);
    const rkey = rkeyOfUri(res.uri);
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
  slug: string;
  createdAt: string;
}): Promise<boolean> {
  const { sessionFetch, did, rkey, title, description, isOpen, slug, createdAt } =
    params;
  try {
    const record: BlueMadoBox = {
      $type: NSID.BOX,
      slug,
      title,
      description,
      isOpen,
      createdAt,
    };
    await xrpc({
      sessionFetch,
      method: "POST",
      lexicon: "com.atproto.repo.putRecord",
      body: { repo: did, collection: NSID.BOX, rkey, record },
    });
    invalidateRecords(did, NSID.BOX);
    return true;
  } catch {
    return false;
  }
}

const DELETES_PER_BATCH = 100;

async function deleteKoesWithAnswers(
  sessionFetch: SessionFetch,
  did: string,
  pick: (koe: { rkey: string; box: string }) => boolean,
  last: { collection: string; rkey: string }[] = [],
): Promise<string[] | null> {
  invalidateRecords(did, NSID.KOE);
  invalidateRecords(did, NSID.ANSWER);
  try {
    const agent = await repoAgent(did);
    const [koes, answers] = await Promise.all([
      listAllRecords(agent, did, NSID.KOE),
      listAllRecords(agent, did, NSID.ANSWER),
    ]);
    const koeRkeys = koes
      .map((r) => ({ rkey: rkeyOfUri(r.uri), box: refOf(r.value, "box") }))
      .filter(pick)
      .map((k) => k.rkey);
    const picked = new Set(koeRkeys);
    const writes = [
      ...answers
        .filter((r) => picked.has(rkeyOfUri(refOf(r.value, "koe"))))
        .map((r) => ({ collection: NSID.ANSWER, rkey: rkeyOfUri(r.uri) })),
      ...koeRkeys.map((rkey) => ({ collection: NSID.KOE, rkey })),
      ...last,
    ].map((w) => ({ $type: "com.atproto.repo.applyWrites#delete", ...w }));
    for (let i = 0; i < writes.length; i += DELETES_PER_BATCH) {
      await xrpc({
        sessionFetch,
        method: "POST",
        lexicon: "com.atproto.repo.applyWrites",
        body: { repo: did, writes: writes.slice(i, i + DELETES_PER_BATCH) },
      });
    }
    return koeRkeys;
  } catch {
    return null;
  } finally {
    invalidateRecords(did, NSID.BOX);
    invalidateRecords(did, NSID.KOE);
    invalidateRecords(did, NSID.ANSWER);
  }
}

export async function deleteBoxWithContents(params: {
  sessionFetch: SessionFetch;
  did: string;
  boxRkey: string;
}): Promise<string[] | null> {
  const { sessionFetch, did, boxRkey } = params;
  const uri = boxUri(did, boxRkey);
  return deleteKoesWithAnswers(sessionFetch, did, (k) => k.box === uri, [
    { collection: NSID.BOX, rkey: boxRkey },
  ]);
}

export async function deleteKoeWithAnswers(params: {
  sessionFetch: SessionFetch;
  did: string;
  koeRkey: string;
}): Promise<boolean> {
  const { sessionFetch, did, koeRkey } = params;
  return (await deleteKoesWithAnswers(sessionFetch, did, (k) => k.rkey === koeRkey)) !== null;
}
