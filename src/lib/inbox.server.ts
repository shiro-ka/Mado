import type { CloudflareStore } from "./store.js";
import type { Question } from "../types/index.js";
import { decryptDid } from "./crypto.js";
import { listQuestions } from "./atproto/index.js";

const BACKFILL_PER_REQUEST = 5;

export async function resolveSenders(
  store: CloudflareStore,
  ownerDid: string,
  questions: { rkey: string; boxUri: string; encryptedFrom?: string }[],
): Promise<Map<string, string>> {
  const senders = await store.listSenders(ownerDid);
  const missing = questions
    .filter((q) => !senders.has(q.rkey) && q.encryptedFrom)
    .slice(0, BACKFILL_PER_REQUEST);
  for (const q of missing) {
    const key = await store.getKeyPair(ownerDid, q.boxUri.split("/").pop() ?? "");
    if (!key) continue;
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
