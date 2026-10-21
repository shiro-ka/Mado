import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { CloudflareStore } from "$lib/store.js";
import { getSession } from "$lib/auth.server.js";
import { restoreOAuthSession } from "$lib/oauth.server.js";
import { deleteKoeWithAnswers } from "$lib/atproto/index.js";

export const DELETE: RequestHandler = async ({ params, cookies, platform }) => {
  const env = platform!.env;
  const store = new CloudflareStore(env);
  const session = await getSession(cookies, store);
  if (!session) return json({ error: "Unauthorized" }, { status: 401 });

  const sessionFetch = await restoreOAuthSession(env, store, session.did, session.deviceKey);
  if (!sessionFetch) return json({ error: "oauth session not found" }, { status: 401 });

  const ok = await deleteKoeWithAnswers({
    sessionFetch,
    did: session.did,
    koeRkey: params.rkey,
  });

  if (!ok) return json({ error: "failed to delete record" }, { status: 500 });

  await store.deleteDeliveries(session.did, [params.rkey]);
  return json({ ok: true });
};
