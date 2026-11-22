import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { fail, withSession } from "$lib/api.server.js";
import { getBoxRecord } from "$lib/atproto/index.js";
import { NO_MAIN_BOX } from "$lib/mainBox.js";

function setMain(event: Parameters<RequestHandler>[0], main: boolean) {
  return withSession(event, async ({ store, session }) => {
    const box = await getBoxRecord(session.did, event.params.rkey);
    if (!box) return fail(404, "窓が見つかりません");
    await store.setMainBoxRkey(session.did, main ? event.params.rkey : NO_MAIN_BOX);
    return json({});
  });
}

export const POST: RequestHandler = (event) => setMain(event, true);
export const DELETE: RequestHandler = (event) => setMain(event, false);
