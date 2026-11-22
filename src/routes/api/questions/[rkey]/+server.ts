import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { fail, withSession } from "$lib/api.server.js";
import { restoreOAuthSession } from "$lib/oauth.server.js";
import { deleteKoeWithAnswers } from "$lib/atproto/index.js";
import { rkeySchema } from "$lib/validation.js";

export const DELETE: RequestHandler = (event) =>
  withSession(event, async ({ env, store, session }) => {
    const rkey = rkeySchema.safeParse(event.params.rkey);
    if (!rkey.success) return fail(400, "入力内容を確認してください");

    const sessionFetch = await restoreOAuthSession(env, store, session.did, session.deviceKey);
    if (!sessionFetch) return fail(401, "再ログインが必要です");

    const ok = await deleteKoeWithAnswers({ sessionFetch, did: session.did, koeRkey: rkey.data });
    if (!ok) return fail(500, "削除に失敗しました");
    return json({});
  });
