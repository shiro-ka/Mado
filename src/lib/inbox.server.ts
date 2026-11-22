import type { CloudflareStore } from "./store.js";
import type { Answer, ReceivedQuestion } from "../types/index.js";
import { listQuestions, listBoxes, getProfiles, getAnswersByOwner } from "./atproto/index.js";
import { koePath, rkeyOfUri } from "./urls.js";

const DELIVERY_SLACK_MS = 5000;

export async function loadInbox(store: CloudflareStore, ownerDid: string) {
  const [{ handled: handledSet, senders, latestSentAt }, blocks] = await Promise.all([
    store.listDeliveryState(ownerDid),
    store.listBlocks(ownerDid),
  ]);
  const questions = await listQuestions(ownerDid, latestSentAt * 1000 + DELIVERY_SLACK_MS);
  const blockSet = new Set(blocks);
  return questions
    .map((q): ReceivedQuestion => ({
      ...q,
      handled: handledSet.has(q.rkey),
      senderDid: senders.get(q.rkey),
    }))
    .filter((q) => !q.senderDid || !blockSet.has(q.senderDid));
}

function answerBodies(list: Answer[] = []) {
  return list.map((a) => a.body);
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
  const questions = boxRkey ? loaded.filter((q) => rkeyOfUri(q.boxUri) === boxRkey) : loaded;
  const boxMap = new Map(boxes.map((b) => [b.rkey, b]));
  const profiles = await getProfiles([
    ...new Set(questions.map((q) => q.senderDid).filter((d): d is string => !!d)),
  ]);
  const allQuestions = questions.map((q) => {
    const box = boxMap.get(rkeyOfUri(q.boxUri));
    const href = box ? koePath(owner.handle, box.slug, q.rkey) : `/receive`;
    const profile = q.senderDid ? profiles.get(q.senderDid) : undefined;
    return {
      ...q,
      href,
      boxTitle: box?.title,
      answers: answerBodies(answers.get(q.uri)),
      senderHandle: profile?.handle,
      senderDisplayName: profile?.displayName,
      senderAvatar: profile?.avatar,
    };
  });
  return { allQuestions };
}
