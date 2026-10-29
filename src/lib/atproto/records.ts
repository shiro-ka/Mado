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
  publicAgent,
  repoAgent,
  listAllRecords,
  invalidateRecords,
  xrpc,
} from "./client.js";
import { byteLength } from "../text.js";

export const NSID = {
  BOX: "blue.mado.box",
  KOE: "blue.mado.koe",
  ANSWER: "blue.mado.answer",
} as const;

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
    const parsed = boxRecord.safeParse(res.data.value);
    if (!parsed.success) return null;
    const record = parsed.data;
    return {
      uri: res.data.uri,
      cid: res.data.cid ?? "",
      rkey,
      slug: record.slug,
      title: record.title,
      description: record.description,
      isOpen: record.isOpen,
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
    return records.flatMap((r) => {
      const parsed = boxRecord.safeParse(r.value);
      if (!parsed.success) return [];
      const record = parsed.data;
      const rkey = r.uri.split("/").pop() ?? "";
      return {
        uri: r.uri,
        cid: r.cid,
        rkey,
        slug: record.slug,
        title: record.title,
        description: record.description,
        isOpen: record.isOpen,
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
    const parsed = koeRecord.safeParse(res.data.value);
    if (!parsed.success) return null;
    const record = parsed.data;
    return {
      uri: res.data.uri,
      cid: res.data.cid ?? "",
      rkey,
      boxUri: record.box,
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
    return records.flatMap((r) => {
      const parsed = koeRecord.safeParse(r.value);
      if (!parsed.success) return [];
      const record = parsed.data;
      const rkey = r.uri.split("/").pop() ?? "";
      return {
        uri: r.uri,
        cid: r.cid,
        rkey,
        boxUri: record.box,
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
      const parsed = answerRecord.safeParse(r.value);
      if (!parsed.success) continue;
      const record = parsed.data;
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
      .flatMap((r) => {
        const parsed = answerRecord.safeParse(r.value);
        return parsed.success && parsed.data.koe === koeUri ? [{ r, record: parsed.data }] : [];
      })
      .map(({ r, record }) => {
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
    const rkeyOf = (uri: string) => uri.split("/").pop() ?? "";
    const koeRkeys = koes
      .map((r) => ({ rkey: rkeyOf(r.uri), box: refOf(r.value, "box") }))
      .filter(pick)
      .map((k) => k.rkey);
    const picked = new Set(koeRkeys);
    const writes = [
      ...answers
        .filter((r) => picked.has(rkeyOf(refOf(r.value, "koe"))))
        .map((r) => ({ collection: NSID.ANSWER, rkey: rkeyOf(r.uri) })),
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
  const boxUri = `at://${did}/${NSID.BOX}/${boxRkey}`;
  return deleteKoesWithAnswers(sessionFetch, did, (k) => k.box === boxUri, [
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
