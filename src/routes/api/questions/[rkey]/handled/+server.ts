import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { fail, withSession } from "$lib/api.server.js";
import { rkeySchema } from "$lib/validation.js";

function setHandled(event: Parameters<RequestHandler>[0], handled: boolean) {
  return withSession(event, async ({ store, session }) => {
    const rkey = rkeySchema.safeParse(event.params.rkey);
    if (!rkey.success) return fail(400, "入力内容を確認してください");
    if (handled) await store.markHandled(session.did, rkey.data);
    else await store.unmarkHandled(session.did, rkey.data);
    return json({});
  });
}

export const POST: RequestHandler = (event) => setHandled(event, true);
export const DELETE: RequestHandler = (event) => setHandled(event, false);
