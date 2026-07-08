import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { CloudflareStore } from "$lib/store.js";
import { checkOAuthSession } from "$lib/oauth.server.js";

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
  // Fail closed: without a configured secret the endpoint stays locked.
  if (!secret) {
    return json({ error: "Cron not configured" }, { status: 503 });
  }
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const store = new CloudflareStore(env);
  const dids = await store.listUsers();

  const results = await Promise.allSettled(
    dids.map(async (did) => {
      const check = await checkOAuthSession(env, store, did);
      // Only delete on a *confirmed* revocation. Transient failures return
      // "error" and are left untouched so a flaky run can't wipe live sessions.
      if (check.status === "revoked") {
        await store.delOAuthSession(did);
        await store.removeUser(did);
        return "revoked" as const;
      }
      if (check.status === "error") {
        console.warn(`[cron/check-sessions] transient error for ${did}:`, check.error);
        return "error" as const;
      }
      return "valid" as const;
    })
  );

  let valid = 0;
  let revoked = 0;
  let errored = 0;
  for (const result of results) {
    if (result.status === "fulfilled") {
      if (result.value === "valid") valid++;
      else if (result.value === "revoked") revoked++;
      else errored++;
    } else {
      errored++;
    }
  }

  console.log(
    `[cron/check-sessions] checked=${dids.length} valid=${valid} revoked=${revoked} errored=${errored}`
  );
  return json({ checked: dids.length, valid, revoked, errored });
};
