import { error, redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { getKoeRecord, getBoxRecord, listAnswers, getProfile } from "$lib/atproto/index.js";
import { requireOwner } from "$lib/owner.server.js";
import { koePath, koeUri as koeUriOf, rkeyOfUri } from "$lib/urls.js";
import type { Question, QuestionBox } from "$lib/../types/index.js";

export const load: PageServerLoad = async ({ parent, params, locals, url }) => {
  const { session } = await parent();
  const { handle: cleanHandle, did: ownerDid } = await requireOwner(params.handle, session);
  const store = locals.store!;
  const koeUri = koeUriOf(ownerDid, params.rkey);
  const isOwner = session?.did === ownerDid;

  const [record, answers, ownerProfile] = await Promise.all([
    getKoeRecord(ownerDid, params.rkey),
    listAnswers(ownerDid, koeUri),
    getProfile(ownerDid),
  ]);

  let question: Question | null = record;
  let box: QuestionBox | null = null;
  if (record) {
    box = await getBoxRecord(ownerDid, rkeyOfUri(record.boxUri));
  } else if (session && !isOwner) {
    const copy = await store.getSentCopy(ownerDid, params.rkey, session.did);
    if (copy?.boxRkey) {
      box = await getBoxRecord(ownerDid, copy.boxRkey);
      if (box) question = { uri: koeUri, cid: "", rkey: params.rkey, boxUri: box.uri, body: copy.body, isRead: false, createdAt: copy.sentAt };
    }
  }

  if (!question || !box) throw error(404, "声が見つかりません");
  if (box.slug !== params.slug) throw redirect(301, koePath(cleanHandle, box.slug, params.rkey));

  const ownerName = ownerProfile?.displayName || cleanHandle;

  let senderDid: string | null = null;
  let senderUnknown = false;
  let senderBlocked = false;
  let isHandled = false;

  if (isOwner) {
    isHandled = await store.isHandled(ownerDid, params.rkey);
    senderDid = await store.getSender(ownerDid, params.rkey);
    senderUnknown = !senderDid;
    if (senderDid) {
      senderBlocked = await store.isBlocked(ownerDid, senderDid);
    }
  } else if (session) {
    await store.markSentRead(session.did, ownerDid, params.rkey);
  }

  const senderProfile = senderDid ? await getProfile(senderDid) : null;
  const card = await store.getCardStyle(ownerDid);

  return {
    cleanHandle,
    ownerName,
    ownerAvatar: ownerProfile?.avatar,
    box,
    isOwner,
    question: { ...question, isRead: isHandled },
    answers,
    koeUri,
    senderDid,
    senderProfile,
    cardVersion: card?.updatedAt ?? null,
    senderBlocked,
    senderUnknown,
    origin: url.origin,
  };
};
