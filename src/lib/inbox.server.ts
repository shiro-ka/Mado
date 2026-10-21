import type { CloudflareStore } from "./store.js";
import type { Answer, Question } from "../types/index.js";
import { listQuestions, listBoxes, getProfiles, getAnswersByOwner } from "./atproto/index.js";

export async function loadInbox(store: CloudflareStore, ownerDid: string) {
  const [questions, handled, blocks, senders] = await Promise.all([
    listQuestions(ownerDid),
    store.listHandled(ownerDid),
    store.listBlocks(ownerDid),
    store.listSenders(ownerDid),
  ]);
  const handledSet = new Set(handled);
  const blockSet = new Set(blocks);
  return questions
    .map((q): Question => ({
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
