import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { fail, withSession } from "$lib/api.server.js";
import { getBoxRecord, listBoxes } from "$lib/atproto/index.js";
import { NO_MAIN_BOX, resolveMainBoxRkey } from "$lib/mainBox.js";

export const POST: RequestHandler = (event) =>
  withSession(event, async ({ store, session }) => {
    const box = await getBoxRecord(session.did, event.params.rkey);
    if (!box) return fail(404, "窓が見つかりません");
    await store.setMainBoxRkey(session.did, event.params.rkey);
    return json({});
  });

export const DELETE: RequestHandler = (event) =>
  withSession(event, async ({ store, session }) => {
    const [boxes, saved] = await Promise.all([listBoxes(session.did), store.getMainBoxRkey(session.did)]);
    if (!boxes.some((b) => b.rkey === event.params.rkey)) return fail(404, "窓が見つかりません");
    if (resolveMainBoxRkey(boxes, saved) === event.params.rkey) await store.setMainBoxRkey(session.did, NO_MAIN_BOX);
    return json({});
  });
