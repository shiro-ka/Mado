import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { z } from "zod";
import { fail, readJson, withSession } from "$lib/api.server.js";
import { didSchema } from "$lib/validation.js";

const schema = z.object({ senderDid: didSchema });

export const DELETE: RequestHandler = (event) =>
  withSession(event, async ({ store, session }) => {
    const data = await readJson(event.request, schema);
    if (!data) return fail(400, "入力内容を確認してください");
    await store.removeBlock(session.did, data.senderDid);
    return json({});
  });
