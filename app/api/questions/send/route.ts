import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { encryptDid } from "@/lib/crypto";
import { writeQuestion, getBoxRecord, getProfile } from "@/lib/atproto";
import { restoreOAuthSession } from "@/lib/oauth";
import { getRedis, Keys, TTL } from "@/lib/redis";
import type { SentRef } from "@/types";

const sendSchema = z.object({
  body: z.string().min(1).max(500),
  boxOwnerDid: z.string().min(1),
  boxRkey: z.string().min(1),
});

/**
 * POST /api/questions/send
 *
 * Verifies sender's DID via their session, encrypts only the sender's DID
 * (body is stored as plaintext per spec v3), then writes the koe record to
 * the box owner's PDS using the owner's stored OAuth session.
 */
export async function POST(request: NextRequest) {
  try {
    // Verify sender is authenticated (proves their DID)
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized", message: "ログインが必要です" },
        { status: 401 }
      );
    }

    const raw = await request.json() as unknown;
    const parsed = sendSchema.safeParse(raw);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", message: "入力内容を確認してください" },
        { status: 400 }
      );
    }

    const { body, boxOwnerDid, boxRkey } = parsed.data;

    // Fetch the box record server-side to get the canonical publicKeyHex.
    // Never trust publicKeyHex from the client — a malicious actor could supply
    // a bogus key, making the question undecryptable by the box owner.
    const box = await getBoxRecord(boxOwnerDid, boxRkey);
    if (!box) {
      return NextResponse.json(
        { error: "Box not found", message: "質問箱が見つかりません" },
        { status: 404 }
      );
    }
    if (!box.isOpen) {
      return NextResponse.json(
        { error: "Box closed", message: "この質問箱は現在受け付けていません" },
        { status: 403 }
      );
    }

    // Check if the sender is blocked by the box owner
    const redis = getRedis();
    const isBlocked = await redis.sismember(Keys.blocklist(boxOwnerDid), session.did);
    if (isBlocked) {
      return NextResponse.json(
        { error: "Blocked", message: "この質問箱への送信が制限されています" },
        { status: 403 }
      );
    }

    // Rate limiting: per-box (1 per minute) and global (5 per 5 minutes).
    // Always call expire after incr (not only on first increment) to ensure
    // keys never lose their TTL if the process crashed between the two calls.
    // This uses sliding-window semantics: the window resets on each request.
    const boxRateKey = Keys.rateBox(session.did, boxRkey);
    const globalRateKey = Keys.rateGlobal(session.did);
    const [boxCount, globalCount] = await Promise.all([
      redis.incr(boxRateKey),
      redis.incr(globalRateKey),
    ]);
    await Promise.all([
      redis.expire(boxRateKey, TTL.RATE_BOX),
      redis.expire(globalRateKey, TTL.RATE_GLOBAL),
    ]);

    if (boxCount > 1) {
      return NextResponse.json(
        { error: "Rate limited", message: "送信が多すぎます。しばらく待ってから再試行してください" },
        { status: 429 }
      );
    }
    if (globalCount > 5) {
      return NextResponse.json(
        { error: "Rate limited", message: "送信が多すぎます。しばらく待ってから再試行してください" },
        { status: 429 }
      );
    }

    // Spam detection: reject if account is very new AND has few followers AND few posts.
    // All three conditions must be true (spec: "すべてを満たす場合は弾く").
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
        return NextResponse.json(
          { error: "Spam detected", message: "アカウントの状態により送信できません" },
          { status: 403 }
        );
      }
    }

    // Encrypt only the sender's DID (body is plaintext per spec v3)
    const encryptedFrom = encryptDid(box.publicKeyHex, session.did);

    // Use the AT-URI from the fetched record (authoritative)
    const boxUri = box.uri;

    // Restore the box owner's OAuth session from Redis.
    // Mado uses the owner's stored session to write to the owner's PDS.
    const ownerSessionFetch = await restoreOAuthSession(boxOwnerDid);
    if (!ownerSessionFetch) {
      return NextResponse.json(
        { error: "Box unavailable", message: "この質問箱は現在利用できません" },
        { status: 503 }
      );
    }

    const result = await writeQuestion({
      sessionFetch: ownerSessionFetch,
      ownerDid: boxOwnerDid,
      boxUri,
      encryptedFrom,
      body,
    });

    if (!result) {
      return NextResponse.json(
        { error: "Write failed", message: "質問の送信に失敗しました" },
        { status: 500 }
      );
    }

    // Store sent ref for sender's outbox
    const koeRkey = result.uri.split("/").pop() ?? "";
    const sentRef: SentRef = { ownerDid: boxOwnerDid, koeRkey, sentAt: new Date().toISOString(), body };
    await redis.lpush(Keys.sent(session.did), sentRef);
    await redis.ltrim(Keys.sent(session.did), 0, 199);

    return NextResponse.json({ success: true, uri: result.uri });
  } catch (err) {
    console.error("[/api/questions/send]", err);
    return NextResponse.json(
      { error: "Internal server error", message: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}
