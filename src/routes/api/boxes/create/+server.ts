import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { z } from "zod";
import { nanoid } from "nanoid";
import { CloudflareStore } from "$lib/store.js";
import { getSession } from "$lib/auth.server.js";
import { restoreOAuthSession } from "$lib/oauth.server.js";
import { generateKeyPair } from "$lib/crypto.js";
import { createBoxRecord } from "$lib/atproto.js";

const createBoxSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(300).optional(),
  isOpen: z.boolean().default(true),
});

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

    const body = await request.json();
    const parsed = createBoxSchema.safeParse(body);
    if (!parsed.success) {
      return json(
        { error: "Invalid request", message: "入力内容を確認してください" },
        { status: 400 }
      );
    }

    const { title, description, isOpen } = parsed.data;

    const sessionFetch = await restoreOAuthSession(env, store, session.did);
    if (!sessionFetch) {
      return json(
        {
          error: "Session expired",
          message: "セッションが期限切れです。再ログインしてください。",
        },
        { status: 401 }
      );
    }

    const slug = nanoid(8);
    const { publicKey, privateKey } = generateKeyPair();

    const result = await createBoxRecord({
      sessionFetch,
      did: session.did,
      slug,
      title,
      description,
      isOpen,
      publicKeyHex: publicKey,
    });

    if (!result) {
      return json(
        { error: "Write failed", message: "質問箱の作成に失敗しました" },
        { status: 500 }
      );
    }

    await store.setKeyPair(session.did, result.rkey, privateKey);

    return json({ success: true, rkey: result.rkey, uri: result.uri, slug });
  } catch (err) {
    console.error("[/api/boxes/create]", err);
    return json(
      { error: "Internal server error", message: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
};
