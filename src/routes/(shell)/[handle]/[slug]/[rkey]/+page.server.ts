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
      if (box) question = { uri: koeUri, cid: "", rkey: params.rkey, boxUri: box.uri, body: copy.body, createdAt: copy.sentAt };
    }
  }

  if (!question || !box) throw error(404, "声が見つかりません");
  if (box.slug !== params.slug) throw redirect(301, koePath(cleanHandle, box.slug, params.rkey));

  const card = await store.getCardStyle(ownerDid);
  const common = {
    cleanHandle,
    ownerName: ownerProfile?.displayName || cleanHandle,
    ownerAvatar: ownerProfile?.avatar,
    box,
    question,
    answers,
    koeUri,
    cardVersion: card?.updatedAt ?? null,
    origin: url.origin,
  };

  if (isOwner) {
    const [handled, senderDid] = await Promise.all([
      store.isHandled(ownerDid, params.rkey),
      store.getSender(ownerDid, params.rkey),
    ]);
    const [senderProfile, senderBlocked] = senderDid
      ? await Promise.all([getProfile(senderDid), store.isBlocked(ownerDid, senderDid)])
      : [null, false];
    return { ...common, isOwner: true as const, handled, senderDid, senderProfile, senderBlocked };
  }

  if (session) await store.markSentRead(session.did, ownerDid, params.rkey);
  return { ...common, isOwner: false as const };
};
