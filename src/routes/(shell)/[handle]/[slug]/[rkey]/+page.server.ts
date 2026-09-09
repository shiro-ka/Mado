import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { CloudflareStore } from "$lib/store.js";
import { resolveHandle, findBoxBySlug, getKoeRecord, listAnswers, getProfile } from "$lib/atproto/index.js";
import { decryptDid } from "$lib/crypto.js";

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
  let decryptError = false;
  let senderBlocked = false;

  if (isOwner) {
    const env = platform!.env;
    const store = new CloudflareStore(env);
    await store.markRead(ownerDid, params.rkey);
    try {
      const privateKeyHex = await store.getKeyPair(ownerDid, box.rkey);
      if (privateKeyHex) {
        senderDid = decryptDid(privateKeyHex, question.encryptedFrom);
      }
    } catch {
      decryptError = true;
    }
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
    question: { ...questionPublic, isRead: isOwner },
    answers,
    koeUri,
    senderDid,
    senderProfile,
    senderBlocked,
    decryptError,
    origin: url.origin,
  };
};
