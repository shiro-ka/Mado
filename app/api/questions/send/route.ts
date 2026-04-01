import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { encryptToBase64 } from "@/lib/crypto";
import { writeQuestion } from "@/lib/atproto";

const sendSchema = z.object({
  body: z.string().min(1).max(500),
  boxOwnerDid: z.string().min(1),
  boxRkey: z.string().min(1),
  publicKeyHex: z.string().min(1),
});

/**
 * POST /api/questions/send
 *
 * Encrypts the question and writes it to the sender's PDS.
 * Requires authentication.
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

    const body = await request.json() as unknown;
    const parsed = sendSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", message: "入力内容を確認してください" },
        { status: 400 }
      );
    }

    const { body: questionBody, boxOwnerDid, boxRkey, publicKeyHex } = parsed.data;

    // Encrypt the question payload
    const encryptedPayload = encryptToBase64(publicKeyHex, {
      from: session.did,
      body: questionBody,
    });

    if (!session.accessJwt) {
      return NextResponse.json(
        { error: "No access token", message: "再ログインが必要です" },
        { status: 401 }
      );
    }

    // Write the question record to the PDS
    const result = await writeQuestion({
      senderAccessJwt: session.accessJwt,
      senderDid: session.did,
      ownerDid: boxOwnerDid,
      boxRkey,
      encryptedPayload,
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
