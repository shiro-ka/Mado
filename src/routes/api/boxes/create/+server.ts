import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { z } from "zod";
import { nanoid } from "nanoid";
import { fail, readJson, withSession } from "$lib/api.server.js";
import { restoreOAuthSession } from "$lib/oauth.server.js";
import { createBoxRecord, isSlugTaken, invalidateRecords, NSID } from "$lib/atproto/index.js";
import { slugSchema, boxTitleSchema, boxDescriptionSchema } from "$lib/validation.js";

const createBoxSchema = z.object({
  title: boxTitleSchema,
  description: boxDescriptionSchema.optional(),
  isOpen: z.boolean().default(true),
  slug: slugSchema.optional(),
});

export const POST: RequestHandler = (event) =>
  withSession(event, async ({ env, store, session }) => {
    const data = await readJson(event.request, createBoxSchema);
    if (!data) return fail(400, "入力内容を確認してください");

    const sessionFetch = await restoreOAuthSession(env, store, session.did, session.deviceKey);
    if (!sessionFetch) return fail(401, "再ログインが必要です");

    if (data.slug && (await isSlugTaken(session.did, data.slug))) {
      return fail(409, "そのURLは既に使われています。別のURLにしてください。");
    }
    const slug = data.slug ?? nanoid(8);

    const result = await createBoxRecord({
      sessionFetch,
      did: session.did,
      slug,
      title: data.title,
      description: data.description,
      isOpen: data.isOpen,
    });
    if (!result) return fail(500, "窓の作成に失敗しました");

    invalidateRecords(session.did, NSID.BOX);
    return json({ rkey: result.rkey, uri: result.uri, slug });
  });
