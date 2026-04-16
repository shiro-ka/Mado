import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { CloudflareStore } from "$lib/store.js";
import { restoreOAuthSession } from "$lib/oauth.server.js";

/**
 * GET /api/cron/check-sessions
 *
 * Verifies OAuth sessions for all registered Mado users.
 * Clears KV OAuth sessions that are no longer valid (revoked or expired).
 * Protected by Authorization: Bearer {CRON_SECRET}.
 */
export const GET: RequestHandler = async ({ request, platform }) => {
  const env = platform!.env;
  const secret = env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const store = new CloudflareStore(env);
  const dids = await store.listUsers();

  const results = await Promise.allSettled(
    dids.map(async (did) => {
      const sessionFetch = await restoreOAuthSession(env, store, did);
      if (!sessionFetch) {
        await store.delOAuthSession(did);
        return "revoked" as const;
      }
      return "valid" as const;
    })
  );

  let valid = 0;
  let revoked = 0;
  for (const result of results) {
    if (result.status === "fulfilled") {
      if (result.value === "valid") valid++;
      else revoked++;
    }
  }

  console.log(
    `[cron/check-sessions] checked=${dids.length} valid=${valid} revoked=${revoked}`
  );
  return json({ checked: dids.length, valid, revoked });
};
