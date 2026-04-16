import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { CloudflareStore } from "$lib/store.js";
import { getSession } from "$lib/auth.server.js";
import { restoreOAuthSession } from "$lib/oauth.server.js";
import { deleteRecord } from "$lib/atproto.js";

export const DELETE: RequestHandler = async ({ params, cookies, platform }) => {
  const env = platform!.env;
  const store = new CloudflareStore(env);
  const session = await getSession(cookies, store);
  if (!session) return json({ error: "Unauthorized" }, { status: 401 });

  const sessionFetch = await restoreOAuthSession(env, store, session.did);
  if (!sessionFetch) return json({ error: "oauth session not found" }, { status: 401 });

  const ok = await deleteRecord({
    sessionFetch,
    did: session.did,
    collection: "blue.mado.koe",
    rkey: params.rkey,
  });

  if (!ok) return json({ error: "failed to delete record" }, { status: 500 });

  await store.unmarkRead(session.did, params.rkey);
  return json({ ok: true });
};
