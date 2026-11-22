import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { z } from "zod";
import { nanoid } from "nanoid";
import { CloudflareStore } from "$lib/store.js";
import { getSession } from "$lib/auth.server.js";
import { restoreOAuthSession } from "$lib/oauth.server.js";
import { createBoxRecord, isSlugTaken, invalidateRecords, NSID } from "$lib/atproto/index.js";
import { slugSchema, boxTitleSchema, boxDescriptionSchema } from "$lib/validation.js";

const createBoxSchema = z.object({
  title: boxTitleSchema,
  description: boxDescriptionSchema.optional(),
  isOpen: z.boolean().default(true),
  slug: slugSchema.optional(),
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

    const body = await request.json().catch(() => null);
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

    let slug = parsed.data.slug;
    if (slug) {
      if (await isSlugTaken(session.did, slug)) {
        return json(
          { error: "Slug taken", message: "そのURLは既に使われています。別のURLにしてください。" },
          { status: 409 }
        );
      }
    } else {
      slug = nanoid(8);
    }

    const result = await createBoxRecord({
      sessionFetch,
      did: session.did,
      slug,
      title,
      description,
      isOpen,
    });

    if (!result) {
      return json(
        { error: "Write failed", message: "窓の作成に失敗しました" },
        { status: 500 }
      );
    }

    invalidateRecords(session.did, NSID.BOX);

    return json({ success: true, rkey: result.rkey, uri: result.uri, slug });
  } catch (err) {
    console.error("[/api/boxes/create]", err);
    return json(
      { error: "Internal server error", message: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
};
