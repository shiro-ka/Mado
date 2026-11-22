import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { fail, withSession } from "$lib/api.server.js";
import { restoreOAuthSession } from "$lib/oauth.server.js";
import { writeFollow, getViewerFollowsActor } from "$lib/atproto/index.js";
import { getOfficialAccount } from "$lib/notify.server.js";

export const POST: RequestHandler = (event) =>
  withSession(event, async ({ env, store, session }) => {
    const [official, sessionFetch] = await Promise.all([
      getOfficialAccount(env),
      restoreOAuthSession(env, store, session.did, session.deviceKey),
    ]);
    if (!official) return fail(503, "通知は現在利用できません");
    if (!sessionFetch) return fail(401, "再ログインが必要です");

    if (await getViewerFollowsActor(sessionFetch, official.did)) return json({ following: true });

    const res = await writeFollow({ sessionFetch, did: session.did, subjectDid: official.did });
    if (!res) return fail(500, "フォローに失敗しました");
    return json({ following: true });
  });
