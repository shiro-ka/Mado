import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { z } from "zod";
import { CloudflareStore } from "$lib/store.js";
import type { SentRef } from "$lib/store.js";
import { getSession } from "$lib/auth.server.js";
import { restoreOAuthSession } from "$lib/oauth.server.js";
import { encryptDid } from "$lib/crypto.js";
import { writeQuestion, getBoxRecord, getProfile } from "$lib/atproto.js";

const sendSchema = z.object({
  body: z.string().min(1).max(500),
  boxOwnerDid: z.string().min(1),
  boxRkey: z.string().min(1),
});

const RATE_BOX_TTL = 60;    // 1 minute
const RATE_GLOBAL_TTL = 300; // 5 minutes

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
        { error: "Box not found", message: "質問箱が見つかりません" },
        { status: 404 }
      );
    }
    if (!box.isOpen) {
      return json(
        { error: "Box closed", message: "この質問箱は現在受け付けていません" },
        { status: 403 }
      );
    }

    const isBlocked = await store.isBlocked(boxOwnerDid, session.did);
    if (isBlocked) {
      return json(
        { error: "Blocked", message: "この質問箱への送信が制限されています" },
        { status: 403 }
      );
    }

    // Rate limiting: per-box (1/min) and global (5/5min)
    const boxRateKey = `rate:box:${session.did}:${boxRkey}`;
    const globalRateKey = `rate:global:${session.did}`;
    const [boxCount, globalCount] = await Promise.all([
      store.incrRate(boxRateKey, RATE_BOX_TTL),
      store.incrRate(globalRateKey, RATE_GLOBAL_TTL),
    ]);

    if (boxCount > 1) {
      return json(
        {
          error: "Rate limited",
          message: "送信が多すぎます。しばらく待ってから再試行してください",
        },
        { status: 429 }
      );
    }
    if (globalCount > 5) {
      return json(
        {
          error: "Rate limited",
          message: "送信が多すぎます。しばらく待ってから再試行してください",
        },
        { status: 429 }
      );
    }

    // Spam detection: new account + few followers + few posts
    const senderProfile = await getProfile(session.did);
    if (senderProfile) {
      const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
      const accountCreatedAt = senderProfile.createdAt
        ? new Date(senderProfile.createdAt).getTime()
        : null;
      const isNewAccount = accountCreatedAt !== null && accountCreatedAt > thirtyDaysAgo;
      const hasFewFollowers = (senderProfile.followersCount ?? 0) < 3;
      const hasFewPosts = (senderProfile.postsCount ?? 0) < 5;

      if (isNewAccount && hasFewFollowers && hasFewPosts) {
        return json(
          { error: "Spam detected", message: "アカウントの状態により送信できません" },
          { status: 403 }
        );
      }
    }

    const encryptedFrom = encryptDid(box.publicKeyHex, session.did);

    const ownerSessionFetch = await restoreOAuthSession(env, store, boxOwnerDid);
    if (!ownerSessionFetch) {
      return json(
        { error: "Box unavailable", message: "この質問箱は現在利用できません" },
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
        { error: "Write failed", message: "質問の送信に失敗しました" },
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

    return json({ success: true, uri: result.uri });
  } catch (err) {
    console.error("[/api/questions/send]", err);
    return json(
      { error: "Internal server error", message: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
};
