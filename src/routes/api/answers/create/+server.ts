import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { z } from "zod";
import { CloudflareStore } from "$lib/store.js";
import { getSession } from "$lib/auth.server.js";
import { restoreOAuthSession } from "$lib/oauth.server.js";
import { writeAnswer, createBskyPost, invalidateRecords, NSID } from "$lib/atproto/index.js";
import { atUriSchema, limitedText } from "$lib/validation.js";
import { POST_MAX_GRAPHEMES, POST_MAX_BYTES } from "$lib/text.js";

const createAnswerSchema = z.object({
  koeUri: atUriSchema,
  body: limitedText(POST_MAX_GRAPHEMES, POST_MAX_BYTES).refine((s) => s.length > 0),
  crosspost: z.boolean().optional().default(false),
  pageUrl: z.string().url().optional(),
  questionBody: z.string().max(1000).optional(),
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

    const raw = await request.json().catch(() => null);
    const parsed = createAnswerSchema.safeParse(raw);
    if (!parsed.success) {
      return json(
        { error: "Invalid request", message: "入力内容を確認してください" },
        { status: 400 }
      );
    }

    const { koeUri, body, crosspost, pageUrl } = parsed.data;

    const expectedPrefix = `at://${session.did}/${NSID.KOE}/`;
    if (!koeUri.startsWith(expectedPrefix)) {
      return json(
        { error: "Forbidden", message: "この声に返信する権限がありません" },
        { status: 403 }
      );
    }

    const appUrl = env.APP_URL ?? "https://mado.blue";
    if (pageUrl && !pageUrl.startsWith(`${appUrl}/`)) {
      return json(
        { error: "Invalid request", message: "不正なURLです" },
        { status: 400 }
      );
    }

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

    const result = await writeAnswer({
      sessionFetch,
      ownerDid: session.did,
      koeUri,
      body,
    });

    if (!result) {
      return json(
        { error: "Write failed", message: "返信の投稿に失敗しました" },
        { status: 500 }
      );
    }

    invalidateRecords(session.did, NSID.ANSWER);
    await store.markHandled(session.did, koeUri.slice(expectedPrefix.length));

    let crossposted = false;
    let crosspostUri: string | null = null;
    if (crosspost) {
      const post = await createBskyPost({
        sessionFetch,
        ownerDid: session.did,
        text: body,
        pageUrl,
        ownerName: session.displayName || session.handle,
      });
      crossposted = post !== null;
      crosspostUri = post?.uri ?? null;
    }

    return json({ success: true, uri: result.uri, crossposted, crosspostUri });
  } catch (err) {
    console.error("[/api/answers/create]", err);
    return json(
      { error: "Internal server error", message: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
};
