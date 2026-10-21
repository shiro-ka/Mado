import type { CloudflareStore } from "./store.js";
import type { Answer, Question } from "../types/index.js";
import { decryptDid } from "./crypto.js";
import { listQuestions, listBoxes, getProfiles, getAnswersByOwner } from "./atproto/index.js";

const BACKFILL_PER_REQUEST = 1;

export async function resolveSenders(
  store: CloudflareStore,
  ownerDid: string,
  questions: { rkey: string; boxUri: string; encryptedFrom?: string }[],
): Promise<Map<string, string>> {
  const senders = await store.listSenders(ownerDid);
  const unresolved = questions.filter((q) => !senders.has(q.rkey) && q.encryptedFrom);
  if (unresolved.length === 0) return senders;
  const keys = await store.listKeyPairs(ownerDid);
  const keyOf = (q: { boxUri: string }) => keys.get(q.boxUri.split("/").pop() ?? "");
  const missing = unresolved.filter((q) => keyOf(q)).slice(0, BACKFILL_PER_REQUEST);
  for (const q of missing) {
    const key = keyOf(q)!;
    try {
      const did = decryptDid(key, q.encryptedFrom!);
      await store.setSender(ownerDid, q.rkey, did);
      senders.set(q.rkey, did);
    } catch {
      continue;
    }
  }
  return senders;
}

export async function loadInbox(store: CloudflareStore, ownerDid: string) {
  const [questions, handled, blocks] = await Promise.all([
    listQuestions(ownerDid),
    store.listHandled(ownerDid),
    store.listBlocks(ownerDid),
  ]);
  const senders = await resolveSenders(store, ownerDid, questions);
  const handledSet = new Set(handled);
  const blockSet = new Set(blocks);
  return questions
    .map(({ encryptedFrom: _, ...q }): Omit<Question, "encryptedFrom"> => ({
      ...q,
      isRead: handledSet.has(q.rkey),
      senderDid: senders.get(q.rkey),
    }))
    .filter((q) => !q.senderDid || !blockSet.has(q.senderDid));
}

function answerBodies(list: Answer[] = []) {
  return [...list].sort((a, b) => a.createdAt.localeCompare(b.createdAt)).map((a) => a.body);
}

export async function buildInbox(
  store: CloudflareStore,
  owner: { did: string; handle: string },
  boxRkey?: string,
) {
  const [loaded, boxes, answers] = await Promise.all([
    loadInbox(store, owner.did),
    listBoxes(owner.did),
    getAnswersByOwner(owner.did),
  ]);
  const questions = boxRkey ? loaded.filter((q) => q.boxUri.split("/").pop() === boxRkey) : loaded;
  const boxMap = new Map(boxes.map((b) => [b.rkey, b]));
  const profiles = await getProfiles([
    ...new Set(questions.map((q) => q.senderDid).filter((d): d is string => !!d)),
  ]);
  const allQuestions = questions.map((q) => {
    const box = boxMap.get(q.boxUri.split("/").pop() ?? "");
    const href = box ? `/@${owner.handle}/${box.slug}/${q.rkey}` : `/receive`;
    const profile = q.senderDid ? profiles.get(q.senderDid) : undefined;
    return {
      ...q,
      href,
      boxTitle: boxRkey ? undefined : box?.title,
      answers: answerBodies(answers.get(q.uri)),
      senderHandle: profile?.handle,
      senderDisplayName: profile?.displayName,
      senderAvatar: profile?.avatar,
    };
  });
  return { allQuestions };
}
