import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { CloudflareStore } from "$lib/store.js";
import { getSession } from "$lib/auth.server.js";
import { getBoxRecord } from "$lib/atproto/index.js";

// Set the caller's "main Mado" to this box (pinned on /@handle, featured to
// visitors). The box must belong to the caller.
export const POST: RequestHandler = async ({ params, cookies, platform }) => {
  try {
    const env = platform!.env;
    const store = new CloudflareStore(env);
    const session = await getSession(cookies, store);
    if (!session) return json({ error: "Unauthorized" }, { status: 401 });

    const box = await getBoxRecord(session.did, params.rkey);
    if (!box) return json({ error: "Not found", message: "窓が見つかりません" }, { status: 404 });

    await store.setMainBoxRkey(session.did, params.rkey);
    return json({ success: true });
  } catch (err) {
    console.error("[POST /api/boxes/[rkey]/main]", err);
    return json({ error: "Internal server error" }, { status: 500 });
  }
};
