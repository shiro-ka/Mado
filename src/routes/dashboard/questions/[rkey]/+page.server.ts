import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { CloudflareStore } from "$lib/store.js";
import { getKoeRecord, listAnswers, getProfile } from "$lib/atproto.js";
import { decryptDid } from "$lib/crypto.js";

export const load: PageServerLoad = async ({ parent, params, platform }) => {
  const { session } = await parent();
  const env = platform!.env;
  const store = new CloudflareStore(env);

  const koeUri = `at://${session.did}/blue.mado.koe/${params.rkey}`;

  const [question, answers] = await Promise.all([
    getKoeRecord(session.did, params.rkey),
    listAnswers(session.did, koeUri),
  ]);

  if (!question) throw error(404, "質問が見つかりません");

  // Mark as read
  await store.markRead(session.did, params.rkey);

  // Decrypt sender DID
  let senderDid: string | null = null;
  let decryptError = false;

  try {
    const boxRkey = question.boxUri.split("/").pop() ?? "";
    const privateKeyHex = await store.getKeyPair(session.did, boxRkey);
    if (privateKeyHex) {
      senderDid = decryptDid(privateKeyHex, question.encryptedFrom);
    }
  } catch {
    decryptError = true;
  }

  const senderProfile = senderDid ? await getProfile(senderDid) : null;

  return {
    question: { ...question, isRead: true },
    answers,
    koeUri,
    senderDid,
    senderProfile,
    decryptError,
  };
};
