import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { z } from "zod";
import { fail, readJson, withSession } from "$lib/api.server.js";

const prefsSchema = z.object({ dmEnabled: z.boolean() });

export const POST: RequestHandler = (event) =>
  withSession(event, async ({ store, session }) => {
    const data = await readJson(event.request, prefsSchema);
    if (!data) return fail(400, "入力内容を確認してください");
    await store.setDmNotify(session.did, data.dmEnabled);
    return json({ dmEnabled: data.dmEnabled });
  });
