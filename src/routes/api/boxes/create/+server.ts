import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { z } from "zod";
import { nanoid } from "nanoid";
import { CloudflareStore } from "$lib/store.js";
import { getSession } from "$lib/auth.server.js";
import { restoreOAuthSession } from "$lib/oauth.server.js";
import { generateKeyPair } from "$lib/crypto.js";
import { createBoxRecord, deleteRecord, NSID } from "$lib/atproto.js";

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

    const sessionFetch = await restoreOAuthSession(env, store, session.did, session.deviceKey);
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

    try {
      await store.setKeyPair(session.did, result.rkey, privateKey);
    } catch (keyErr) {
      // The box record already exists on the PDS, but we failed to persist its
      // private key. Without the key the owner could never decrypt any sender
      // DID for this box, so roll the record back rather than leave an
      // undecryptable orphan (and let the user retry cleanly).
      console.error(
        "[/api/boxes/create] key persist failed — rolling back box record",
        keyErr
      );
      await deleteRecord({
        sessionFetch,
        did: session.did,
        collection: NSID.BOX,
        rkey: result.rkey,
      });
      return json(
        {
          error: "Write failed",
          message: "質問箱の作成に失敗しました。もう一度お試しください。",
        },
        { status: 500 }
      );
    }

    return json({ success: true, rkey: result.rkey, uri: result.uri, slug });
  } catch (err) {
    console.error("[/api/boxes/create]", err);
    return json(
      { error: "Internal server error", message: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
};
