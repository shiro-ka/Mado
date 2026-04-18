import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { z } from "zod";
import { CloudflareStore } from "$lib/store.js";
import { getSession } from "$lib/auth.server.js";
import { restoreOAuthSession } from "$lib/oauth.server.js";
import { writeAnswer, createBskyPost, NSID } from "$lib/atproto.js";

const createAnswerSchema = z.object({
  koeUri: z.string().min(1), // AT-URI: at://ownerDid/blue.mado.koe/rkey
  body: z.string().min(1).max(1000),
  crosspost: z.boolean().optional().default(false),
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

    const raw = await request.json();
    const parsed = createAnswerSchema.safeParse(raw);
    if (!parsed.success) {
      return json(
        { error: "Invalid request", message: "入力内容を確認してください" },
        { status: 400 }
      );
    }

    const { koeUri, body, crosspost } = parsed.data;

    // Security: verify koeUri belongs to the logged-in user's repo
    const expectedPrefix = `at://${session.did}/${NSID.KOE}/`;
    if (!koeUri.startsWith(expectedPrefix)) {
      return json(
        { error: "Forbidden", message: "この質問に回答する権限がありません" },
        { status: 403 }
      );
    }

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

    const result = await writeAnswer({
      sessionFetch,
      ownerDid: session.did,
      koeUri,
      body,
    });

    if (!result) {
      return json(
        { error: "Write failed", message: "回答の投稿に失敗しました" },
        { status: 500 }
      );
    }

    if (crosspost) {
      await createBskyPost({ sessionFetch, ownerDid: session.did, text: body });
    }

    return json({ success: true, uri: result.uri });
  } catch (err) {
    console.error("[/api/answers/create]", err);
    return json(
      { error: "Internal server error", message: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
};
