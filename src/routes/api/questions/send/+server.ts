import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { z } from "zod";
import { CloudflareStore } from "$lib/store.js";
import type { SentRef } from "$lib/store.js";
import { getSession } from "$lib/auth.server.js";
import { restoreAnyOAuthSession } from "$lib/oauth.server.js";
import { encryptDid } from "$lib/crypto.js";
import { writeQuestion, getBoxRecord, getProfile } from "$lib/atproto.js";
import { notifyNewKoe } from "$lib/notify.server.js";
import { didSchema, rkeySchema } from "$lib/validation.js";

const sendSchema = z.object({
  body: z.string().min(1).max(500),
  boxOwnerDid: didSchema,
  boxRkey: rkeySchema,
});

const RATE_BOX_TTL = 60;    // 1 minute
const RATE_GLOBAL_TTL = 300; // 5 minutes

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Block when the spam score reaches this. Higher = more lenient (fewer false
// positives, but lets more throwaway accounts through). Tune to taste.
const SPAM_SCORE_THRESHOLD = 6;

export const POST: RequestHandler = async ({ request, cookies, platform }) => {
  try {
    const env = platform!.env;
    const store = new CloudflareStore(env);
    const session = await getSession(cookies, store);
    if (!session) {
      return json(
        { error: "Unauthorized", message: "ログインが必要です" },
        { status: 401 }
      );
    }

    const raw = await request.json();
    const parsed = sendSchema.safeParse(raw);
    if (!parsed.success) {
      return json(
        { error: "Invalid request", message: "入力内容を確認してください" },
        { status: 400 }
      );
    }

    const { body, boxOwnerDid, boxRkey } = parsed.data;

    const box = await getBoxRecord(boxOwnerDid, boxRkey);
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
    if (isBlocked) {
      return json(
        { error: "Blocked", message: "この窓への送信が制限されています" },
        { status: 403 }
      );
    }

    // Idempotency guard: block identical re-submissions (double-click, retry,
    // or a concurrent request that slips past the non-atomic rate counter) from
    // writing a duplicate koe. Keyed on sender+box+body so distinct questions
    // are unaffected. Runs before the rate counters so a duplicate consumes no
    // quota. Best-effort (KV isn't a strict mutex) but stops the common case.
    const bodyHash = await sha256Hex(`${boxOwnerDid}:${boxRkey}:${body}`);
    const dedupeKey = `dedupe:send:${session.did}:${bodyHash}`;
    const fresh = await store.claimOnce(dedupeKey, RATE_BOX_TTL);
    if (!fresh) {
      return json(
        {
          error: "Duplicate",
          message: "同じ声を送信したばかりです。しばらく待ってから再送してください。",
        },
        { status: 429 }
      );
    }

    // Rate limiting is split so a *rejected* send never burns the global quota
    // (which would self-lock the user across all boxes). The per-box limit
    // (1/min) is checked first; the global limit (5/5min) is only consumed once
    // the send has cleared the per-box and spam checks, just before the write.
    const boxRateKey = `rate:box:${session.did}:${boxRkey}`;
    const globalRateKey = `rate:global:${session.did}`;

    const boxCount = await store.incrRate(boxRateKey, RATE_BOX_TTL);
    if (boxCount > 1) {
      return json(
        {
          error: "Rate limited",
          message: "送信が多すぎます。しばらく待ってから再試行してください",
        },
        { status: 429 }
      );
    }

    // Spam heuristic — one profile fetch, scored from weak signals. Each adds
    // points; we only block accounts that trip several at once, so a
    // hesitant-but-real new user (who has set an avatar/name) still gets through.
    const senderProfile = await getProfile(session.did);
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
      if (ageDays < 7) score += 2;        // brand-new account
      else if (ageDays < 30) score += 1;  // still young
      if (followers === 0) score += 2;
      else if (followers < 3) score += 1;
      if (posts === 0) score += 2;
      else if (posts < 5) score += 1;
      if (!senderProfile.avatar) score += 1;       // default egg icon
      if (!senderProfile.displayName) score += 1;  // never set a name
      // follow-spam pattern: follows many, almost nobody follows back
      if (follows > 50 && follows > followers * 10) score += 1;

      if (score >= SPAM_SCORE_THRESHOLD) {
        return json(
          { error: "Spam detected", message: "アカウントの状態により送信できません" },
          { status: 403 }
        );
      }
    }

    // Cleared per-box + spam — now consume the global quota (5/5min).
    const globalCount = await store.incrRate(globalRateKey, RATE_GLOBAL_TTL);
    if (globalCount > 5) {
      return json(
        {
          error: "Rate limited",
          message: "送信が多すぎます。しばらく待ってから再試行してください",
        },
        { status: 429 }
      );
    }

    const encryptedFrom = encryptDid(box.publicKeyHex, session.did);

    const ownerSessionFetch = await restoreAnyOAuthSession(env, store, boxOwnerDid);
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
      encryptedFrom,
      body,
    });

    if (!result) {
      return json(
        { error: "Write failed", message: "声の送信に失敗しました" },
        { status: 500 }
      );
    }

    const koeRkey = result.uri.split("/").pop() ?? "";
    const sentRef: SentRef = {
      ownerDid: boxOwnerDid,
      koeRkey,
      sentAt: new Date().toISOString(),
      body,
    };
    await store.pushSent(session.did, sentRef, 200);

    // Opt-in DM notification to the owner. Runs after the response and never
    // affects the send outcome — the koe is already in the owner's /receive
    // inbox regardless of whether the DM lands.
    platform!.ctx.waitUntil(
      notifyNewKoe(env, store, {
        ownerDid: boxOwnerDid,
        boxTitle: box.title,
        body,
      })
    );

    return json({ success: true, uri: result.uri });
  } catch (err) {
    console.error("[/api/questions/send]", err);
    return json(
      { error: "Internal server error", message: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
};
