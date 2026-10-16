import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { CloudflareStore } from "$lib/store.js";
import { resolveHandle, findBoxBySlug, getKoeRecord, listAnswers, getProfile } from "$lib/atproto/index.js";
import { resolveSenders } from "$lib/inbox.server.js";

export const load: PageServerLoad = async ({ parent, params, platform, url }) => {
  const { session } = await parent();
  const cleanHandle = decodeURIComponent(params.handle).replace(/^@/, "");

  const ownerDid = await resolveHandle(cleanHandle);
  if (!ownerDid) throw error(404, "ユーザーが見つかりません");

  const box = await findBoxBySlug(ownerDid, params.slug);
  if (!box) throw error(404, "窓が見つかりません");

  const koeUri = `at://${ownerDid}/blue.mado.koe/${params.rkey}`;

  const [question, answers, ownerProfile] = await Promise.all([
    getKoeRecord(ownerDid, params.rkey),
    listAnswers(ownerDid, koeUri),
    getProfile(ownerDid), // for the OG/share title (owner display name)
  ]);

  if (!question) throw error(404, "声が見つかりません");

  const ownerName = ownerProfile?.displayName || cleanHandle;

  const isOwner = session?.did === ownerDid;

  let senderDid: string | null = null;
  let senderUnknown = false;
  let senderBlocked = false;
  let isHandled = false;

  if (isOwner) {
    const env = platform!.env;
    const store = new CloudflareStore(env);
    isHandled = await store.isHandled(ownerDid, params.rkey);
    senderDid = (await resolveSenders(store, ownerDid, [question])).get(question.rkey) ?? null;
    senderUnknown = !senderDid;
    if (senderDid) {
      senderBlocked = await store.isBlocked(ownerDid, senderDid);
    }
  }

  const senderProfile = senderDid ? await getProfile(senderDid) : null;

  const { encryptedFrom: _, ...questionPublic } = question;

  return {
    cleanHandle,
    ownerName,
    box,
    isOwner,
    question: { ...questionPublic, isRead: isHandled },
    answers,
    koeUri,
    senderDid,
    senderProfile,
    senderBlocked,
    senderUnknown,
    origin: url.origin,
  };
};
