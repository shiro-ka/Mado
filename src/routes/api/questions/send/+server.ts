import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { z } from "zod";
import { fail, readJson, withSession } from "$lib/api.server.js";
import { restoreAnyOAuthSession } from "$lib/oauth.server.js";
import { writeQuestion, getBoxRecord, getProfile, deleteRecord, invalidateRecords, NSID } from "$lib/atproto/index.js";
import { notifyNewKoe } from "$lib/notify.server.js";
import { didSchema, rkeySchema, postBodySchema } from "$lib/validation.js";

const sendSchema = z.object({
  body: postBodySchema,
  boxOwnerDid: didSchema,
  boxRkey: rkeySchema,
});

const RATE_BOX_TTL = 60;
const RATE_GLOBAL_TTL = 300;

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

const SPAM_SCORE_THRESHOLD = 6;

export const POST: RequestHandler = (event) =>
  withSession(event, async ({ env, store, session }) => {
    const data = await readJson(event.request, sendSchema);
    if (!data) return fail(400, "入力内容を確認してください");

    const { body, boxOwnerDid, boxRkey } = data;

    const box = await getBoxRecord(boxOwnerDid, boxRkey);
    if (!box) {
      return fail(404, "窓が見つかりません");
    }
    if (!box.isOpen) {
      return fail(403, "この窓は現在受け付けていません");
    }

    const isBlocked = await store.isBlocked(boxOwnerDid, session.did);
    if (isBlocked) {
      return fail(403, "この窓への送信が制限されています");
    }

    const profilePromise = getProfile(session.did);
    const ownerSessionPromise = restoreAnyOAuthSession(env, store, boxOwnerDid);
    event.platform!.ctx.waitUntil(ownerSessionPromise);

    const bodyHash = await sha256Hex(`${boxOwnerDid}:${boxRkey}:${body}`);
    const dedupeKey = `dedupe:send:${session.did}:${bodyHash}`;
    const fresh = (await store.hitLimit(dedupeKey, RATE_BOX_TTL)) === 1;
    if (!fresh) {
      return fail(429, "同じ声を送信したばかりです。しばらく待ってから再送してください。");
    }

    const boxRateKey = `rate:box:${session.did}:${boxRkey}`;
    const globalRateKey = `rate:global:${session.did}`;

    const boxCount = await store.hitLimit(boxRateKey, RATE_BOX_TTL);
    if (boxCount > 1) {
      return fail(429, "送信が多すぎます。しばらく待ってから再試行してください");
    }

    const senderProfile = await profilePromise;
    if (senderProfile) {
      const day = 24 * 60 * 60 * 1000;
      const createdAt = senderProfile.createdAt
        ? new Date(senderProfile.createdAt).getTime()
        : null;
      const ageDays = createdAt !== null ? (Date.now() - createdAt) / day : Infinity;
      const followers = senderProfile.followersCount ?? 0;
      const follows = senderProfile.followsCount ?? 0;
      const posts = senderProfile.postsCount ?? 0;

      let score = 0;
      if (ageDays < 7) score += 2;
      else if (ageDays < 30) score += 1;
      if (followers === 0) score += 2;
      else if (followers < 3) score += 1;
      if (posts === 0) score += 2;
      else if (posts < 5) score += 1;
      if (!senderProfile.avatar) score += 1;
      if (!senderProfile.displayName) score += 1;
      if (follows > 50 && follows > followers * 10) score += 1;

      if (score >= SPAM_SCORE_THRESHOLD) {
        return fail(403, "アカウントの状態により送信できません");
      }
    }

    const globalCount = await store.hitLimit(globalRateKey, RATE_GLOBAL_TTL);
    if (globalCount > 5) {
      return fail(429, "送信が多すぎます。しばらく待ってから再試行してください");
    }

    const ownerSessionFetch = await ownerSessionPromise;
    if (!ownerSessionFetch) {
      return fail(503, "この窓は現在利用できません");
    }

    const result = await writeQuestion({
      sessionFetch: ownerSessionFetch,
      ownerDid: boxOwnerDid,
      boxUri: box.uri,
      body,
    });

    if (!result) {
      return fail(500, "声の送信に失敗しました");
    }

    invalidateRecords(boxOwnerDid, NSID.KOE);

    const koeRkey = result.uri.split("/").pop() ?? "";
    try {
      await store.recordDelivery({
        ownerDid: boxOwnerDid,
        koeRkey,
        boxRkey,
        senderDid: session.did,
        sentAt: new Date().toISOString(),
        body,
      });
    } catch (recordErr) {
      console.error("[/api/questions/send] delivery record failed — rolling back koe", recordErr);
      await deleteRecord({ sessionFetch: ownerSessionFetch, did: boxOwnerDid, collection: NSID.KOE, rkey: koeRkey });
      invalidateRecords(boxOwnerDid, NSID.KOE);
      return fail(500, "声の送信に失敗しました");
    }

    event.platform!.ctx.waitUntil(store.pruneLimits());
    event.platform!.ctx.waitUntil(
      notifyNewKoe(env, store, {
        ownerDid: boxOwnerDid,
        boxTitle: box.title,
        body,
      })
    );

    return json({ uri: result.uri });
  });
