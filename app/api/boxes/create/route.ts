import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { nanoid } from "nanoid";
import { getSession } from "@/lib/auth";
import { getRedis, Keys } from "@/lib/redis";
import { generateKeyPair } from "@/lib/crypto";
import { createBoxRecord } from "@/lib/atproto";

const createBoxSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(300).optional(),
  isOpen: z.boolean().default(true),
});

/**
 * POST /api/boxes/create
 *
 * Creates a new question box:
 * 1. Generates an ECIES key pair
 * 2. Stores the private key in Redis
 * 3. Writes the box record (with public key) to the user's PDS
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.accessJwt) {
      return NextResponse.json(
        { error: "Unauthorized", message: "ログインが必要です" },
        { status: 401 }
      );
    }

    const body = await request.json() as unknown;
    const parsed = createBoxSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", message: "入力内容を確認してください" },
        { status: 400 }
      );
    }

    const { title, description, isOpen } = parsed.data;

    // Generate a unique slug
    const slug = nanoid(8);

    // Generate ECIES key pair for this box
    const { publicKey, privateKey } = generateKeyPair();

    // Write box record to PDS
    const result = await createBoxRecord({
      accessJwt: session.accessJwt,
      did: session.did,
      slug,
      title,
      description,
      isOpen,
      publicKeyHex: publicKey,
    });

    if (!result) {
      return NextResponse.json(
        { error: "Write failed", message: "質問箱の作成に失敗しました" },
        { status: 500 }
      );
    }

    // Store the private key in Redis (never leaves the server)
    const redis = getRedis();
    await redis.set(Keys.keyPair(session.did, result.rkey), privateKey);

    return NextResponse.json({
      success: true,
      rkey: result.rkey,
      uri: result.uri,
      slug,
    });
  } catch (err) {
    console.error("[/api/boxes/create]", err);
    return NextResponse.json(
      { error: "Internal server error", message: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}
