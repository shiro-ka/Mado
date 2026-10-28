import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { z } from "zod";
import { CloudflareStore } from "$lib/store.js";
import { getSession } from "$lib/auth.server.js";
import { restoreAnyOAuthSession } from "$lib/oauth.server.js";
import { writeQuestion, getBoxRecord, getProfile, deleteRecord, invalidateRecords, NSID } from "$lib/atproto/index.js";
import { notifyNewKoe } from "$lib/notify.server.js";
import { didSchema, rkeySchema } from "$lib/validation.js";

const sendSchema = z.object({
  body: z.string().min(1).max(500),
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

export const POST: RequestHandler = async ({ request, cookies, platform }) => {
  const timing: string[] = [];
  let last = Date.now();
  const mark = (name: string, desc?: string) => {
    const now = Date.now();
    timing.push(`${name};dur=${now - last}${desc ? `;desc="${desc}"` : ""}`);
    last = now;
  };
  try {
    const env = platform!.env;
    const store = new CloudflareStore(env);
    const session = await getSession(cookies, store);
    mark("session");
    if (!session) {
      return json(
        { error: "Unauthorized", message: "ログインが必要です" },
        { status: 401 }
      );
    }

    const raw = await request.json().catch(() => null);
    const parsed = sendSchema.safeParse(raw);
    if (!parsed.success) {
      return json(
        { error: "Invalid request", message: "入力内容を確認してください" },
        { status: 400 }
      );
    }

    const { body, boxOwnerDid, boxRkey } = parsed.data;

    const box = await getBoxRecord(boxOwnerDid, boxRkey);
    mark("box");
    if (!box) {
      return json(
        { error: "Box not found", message: "窓が見つかりません" },
        { status: 404 }
      );
    }
    if (!box.isOpen) {
      return json(
        { error: "Box closed", message: "この窓は現在受け付けていません" },
        { status: 403 }
      );
    }

    const isBlocked = await store.isBlocked(boxOwnerDid, session.did);
    mark("blocked");
    if (isBlocked) {
      return json(
        { error: "Blocked", message: "この窓への送信が制限されています" },
        { status: 403 }
      );
    }

    const profilePromise = getProfile(session.did);
    const ownerSessionPromise = restoreAnyOAuthSession(env, store, boxOwnerDid);
    platform!.ctx.waitUntil(ownerSessionPromise);

    const bodyHash = await sha256Hex(`${boxOwnerDid}:${boxRkey}:${body}`);
    const dedupeKey = `dedupe:send:${session.did}:${bodyHash}`;
    const fresh = (await store.hitLimit(dedupeKey, RATE_BOX_TTL)) === 1;
    mark("dedupe");
    if (!fresh) {
      return json(
        {
          error: "Duplicate",
          message: "同じ声を送信したばかりです。しばらく待ってから再送してください。",
        },
        { status: 429 }
      );
    }

    const boxRateKey = `rate:box:${session.did}:${boxRkey}`;
    const globalRateKey = `rate:global:${session.did}`;

    const boxCount = await store.hitLimit(boxRateKey, RATE_BOX_TTL);
    mark("rateBox");
    if (boxCount > 1) {
      return json(
        {
          error: "Rate limited",
          message: "送信が多すぎます。しばらく待ってから再試行してください",
        },
        { status: 429 }
      );
    }

    const senderProfile = await profilePromise;
    mark("profile");
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
        return json(
          { error: "Spam detected", message: "アカウントの状態により送信できません" },
          { status: 403 }
        );
      }
    }

    const globalCount = await store.hitLimit(globalRateKey, RATE_GLOBAL_TTL);
    mark("rateGlobal");
    const ownerKeys = await store.listDeviceKeysForDid(boxOwnerDid);
    mark("ownerKeys", `n=${ownerKeys.length}`);
    if (globalCount > 5) {
      return json(
        {
          error: "Rate limited",
          message: "送信が多すぎます。しばらく待ってから再試行してください",
        },
        { status: 429 }
      );
    }

    const ownerSessionFetch = await ownerSessionPromise;
    mark("restore");
    if (!ownerSessionFetch) {
      return json(
        { error: "Box unavailable", message: "この窓は現在利用できません" },
        { status: 503 }
      );
    }

    const result = await writeQuestion({
      sessionFetch: ownerSessionFetch,
      ownerDid: boxOwnerDid,
      boxUri: box.uri,
      body,
    });
    mark("write");

    if (!result) {
      return json(
        { error: "Write failed", message: "声の送信に失敗しました" },
        { status: 500 }
      );
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
      mark("delivery");
    } catch (recordErr) {
      console.error("[/api/questions/send] delivery record failed — rolling back koe", recordErr);
      await deleteRecord({ sessionFetch: ownerSessionFetch, did: boxOwnerDid, collection: NSID.KOE, rkey: koeRkey });
      invalidateRecords(boxOwnerDid, NSID.KOE);
      return json(
        { error: "Write failed", message: "声の送信に失敗しました" },
        { status: 500 }
      );
    }

    platform!.ctx.waitUntil(store.pruneLimits());
    platform!.ctx.waitUntil(
      notifyNewKoe(env, store, {
        ownerDid: boxOwnerDid,
        boxTitle: box.title,
        body,
      })
    );

    const res = json({ success: true, uri: result.uri });
    res.headers.set("Server-Timing", timing.join(", "));
    return res;
  } catch (err) {
    console.error("[/api/questions/send]", err);
    return json(
      { error: "Internal server error", message: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
};
