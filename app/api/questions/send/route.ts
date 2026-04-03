import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { encryptDid } from "@/lib/crypto";
import { writeQuestion, getBoxRecord } from "@/lib/atproto";
import { restoreOAuthSession } from "@/lib/oauth";

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

    return NextResponse.json({ success: true, uri: result.uri });
  } catch (err) {
    console.error("[/api/questions/send]", err);
    return NextResponse.json(
      { error: "Internal server error", message: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}
