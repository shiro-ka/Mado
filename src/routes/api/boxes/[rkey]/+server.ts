import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { z } from "zod";
import { fail, readJson, withSession } from "$lib/api.server.js";
import { restoreOAuthSession } from "$lib/oauth.server.js";
import { getBoxRecord, updateBoxRecord, deleteBoxWithContents, isSlugTaken, invalidateRecords, NSID } from "$lib/atproto/index.js";
import { slugSchema, boxTitleSchema, boxDescriptionSchema } from "$lib/validation.js";

const updateSchema = z.object({
  title: boxTitleSchema.optional(),
  description: boxDescriptionSchema.optional(),
  isOpen: z.boolean().optional(),
  slug: slugSchema.optional(),
});

export const PATCH: RequestHandler = (event) =>
  withSession(event, async ({ env, store, session }) => {
    const sessionFetch = await restoreOAuthSession(env, store, session.did, session.deviceKey);
    if (!sessionFetch) return fail(401, "再ログインが必要です");

    const box = await getBoxRecord(session.did, event.params.rkey);
    if (!box) return fail(404, "窓が見つかりません");

    const data = await readJson(event.request, updateSchema);
    if (!data) return fail(400, "入力内容を確認してください");

    if (data.slug && data.slug !== box.slug && (await isSlugTaken(session.did, data.slug, event.params.rkey))) {
      return fail(409, "そのURLは既に使われています。別のURLにしてください。");
    }

    const success = await updateBoxRecord({
      sessionFetch,
      did: session.did,
      rkey: event.params.rkey,
      title: data.title ?? box.title,
      description: data.description ?? box.description,
      isOpen: data.isOpen ?? box.isOpen,
      slug: data.slug ?? box.slug,
      createdAt: box.createdAt,
    });
    if (!success) return fail(500, "更新に失敗しました");

    invalidateRecords(session.did, NSID.BOX);
    return json({});
  });

export const DELETE: RequestHandler = (event) =>
  withSession(event, async ({ env, store, session }) => {
    const sessionFetch = await restoreOAuthSession(env, store, session.did, session.deviceKey);
    if (!sessionFetch) return fail(401, "再ログインが必要です");

    const deleted = await deleteBoxWithContents({ sessionFetch, did: session.did, boxRkey: event.params.rkey });
    if (!deleted) return fail(500, "削除に失敗しました");
    return json({});
  });
