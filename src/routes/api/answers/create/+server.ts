import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { z } from "zod";
import { restoreOAuthSession } from "$lib/oauth.server.js";
import { atUriSchema, postBodySchema } from "$lib/validation.js";
import { fail, readJson, withSession } from "$lib/api.server.js";
import { answerKoe } from "$lib/koe.server.js";

const createAnswerSchema = z.object({
  koeUri: atUriSchema,
  body: postBodySchema,
  crosspost: z.boolean().optional().default(false),
});

export const POST: RequestHandler = (event) =>
  withSession(event, async ({ env, store, session }) => {
    const data = await readJson(event.request, createAnswerSchema);
    if (!data) return fail(400, "入力内容を確認してください");

    const sessionFetch = await restoreOAuthSession(env, store, session.did, session.deviceKey);
    if (!sessionFetch) return fail(401, "再ログインが必要です");

    const answered = await answerKoe(env, store, session, sessionFetch, data);
    return answered.ok ? json(answered.value) : fail(answered.status, answered.message);
  });
