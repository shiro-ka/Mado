import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { z } from "zod";
import { fail, readJson, withSession } from "$lib/api.server.js";
import { didSchema, rkeySchema, postBodySchema } from "$lib/validation.js";
import { sendKoe } from "$lib/koe.server.js";

const sendSchema = z.object({
  body: postBodySchema,
  boxOwnerDid: didSchema,
  boxRkey: rkeySchema,
});

export const POST: RequestHandler = (event) =>
  withSession(event, async ({ env, store, session }) => {
    const data = await readJson(event.request, sendSchema);
    if (!data) return fail(400, "入力内容を確認してください");

    const sent = await sendKoe(env, store, event.platform!.ctx, session.did, {
      body: data.body,
      ownerDid: data.boxOwnerDid,
      boxRkey: data.boxRkey,
    });
    return sent.ok ? json(sent.value) : fail(sent.status, sent.message);
  });
