import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { getRedis, Keys } from "@/lib/redis";

const schema = z.object({
  senderDid: z.string().min(1),
});

/**
 * POST /api/blocks/create
 *
 * Adds a sender's DID to the authenticated user's blocklist in Redis.
 * Blocked senders will receive a 403 when trying to send questions.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized", message: "ログインが必要です" },
        { status: 401 }
      );
    }

    const raw = await request.json() as unknown;
    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", message: "入力内容を確認してください" },
        { status: 400 }
      );
    }

    const { senderDid } = parsed.data;

    if (senderDid === session.did) {
      return NextResponse.json(
        { error: "Bad request", message: "自分自身をブロックすることはできません" },
        { status: 400 }
      );
    }

    const redis = getRedis();
    await redis.sadd(Keys.blocklist(session.did), senderDid);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[/api/blocks/create]", err);
    return NextResponse.json(
      { error: "Internal server error", message: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}
