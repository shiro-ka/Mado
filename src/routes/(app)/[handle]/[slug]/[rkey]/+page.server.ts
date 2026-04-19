import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { CloudflareStore } from "$lib/store.js";
import { resolveHandle, findBoxBySlug, getKoeRecord, listAnswers, getProfile } from "$lib/atproto.js";
import { decryptDid } from "$lib/crypto.js";

export const load: PageServerLoad = async ({ parent, params, platform, url }) => {
  const { session } = await parent();
  const cleanHandle = decodeURIComponent(params.handle).replace(/^@/, "");

  const ownerDid = await resolveHandle(cleanHandle);
  if (!ownerDid) throw error(404, "ユーザーが見つかりません");

  const box = await findBoxBySlug(ownerDid, params.slug);
  if (!box) throw error(404, "質問箱が見つかりません");

  const koeUri = `at://${ownerDid}/blue.mado.koe/${params.rkey}`;

  const [question, answers] = await Promise.all([
    getKoeRecord(ownerDid, params.rkey),
    listAnswers(ownerDid, koeUri),
  ]);

  if (!question) throw error(404, "声が見つかりません");

  const isOwner = session?.did === ownerDid;

  let senderDid: string | null = null;
  let decryptError = false;

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
  }

  const senderProfile = senderDid ? await getProfile(senderDid) : null;

  const { encryptedFrom: _, ...questionPublic } = question;

  return {
    cleanHandle,
    box,
    isOwner,
    question: { ...questionPublic, isRead: isOwner },
    answers,
    koeUri,
    senderDid,
    senderProfile,
    decryptError,
    origin: url.origin,
  };
};
