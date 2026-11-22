import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { z } from "zod";
import { restoreOAuthSession } from "$lib/oauth.server.js";
import { writeAnswer, createBskyPost, invalidateRecords, getKoeRecord, getBoxRecord, NSID } from "$lib/atproto/index.js";
import { koePath, rkeyOfUri } from "$lib/urls.js";
import { atUriSchema, postBodySchema } from "$lib/validation.js";
import { appOrigin, fail, readJson, withSession } from "$lib/api.server.js";

const createAnswerSchema = z.object({
  koeUri: atUriSchema,
  body: postBodySchema,
  crosspost: z.boolean().optional().default(false),
});

export const POST: RequestHandler = (event) =>
  withSession(event, async ({ env, store, session }) => {
    const data = await readJson(event.request, createAnswerSchema);
    if (!data) return fail(400, "入力内容を確認してください");

    const { koeUri, body, crosspost } = data;

    const expectedPrefix = `at://${session.did}/${NSID.KOE}/`;
    if (!koeUri.startsWith(expectedPrefix)) return fail(403, "この声に返信する権限がありません");

    const sessionFetch = await restoreOAuthSession(env, store, session.did, session.deviceKey);
    if (!sessionFetch) return fail(401, "再ログインが必要です");

    const result = await writeAnswer({ sessionFetch, ownerDid: session.did, koeUri, body });
    if (!result) return fail(500, "返信の投稿に失敗しました");

    invalidateRecords(session.did, NSID.ANSWER);
    await store.markHandled(session.did, koeUri.slice(expectedPrefix.length));

    let crossposted = false;
    let crosspostUri: string | null = null;
    if (crosspost) {
      const rkey = rkeyOfUri(koeUri);
      const koe = await getKoeRecord(session.did, rkey);
      const box = koe ? await getBoxRecord(session.did, rkeyOfUri(koe.boxUri)) : null;
      const pageUrl = box ? appOrigin(env) + koePath(session.handle, box.slug, rkey) : undefined;
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

    return json({ uri: result.uri, crossposted, crosspostUri });
  });
