import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { CloudflareStore } from "$lib/store.js";
import { checkOAuthSession } from "$lib/oauth.server.js";

/**
 * Constant-time string comparison. Hashes both inputs to a fixed length first
 * (so length differences don't leak) and XOR-accumulates the digest bytes.
 */
async function timingSafeEqual(a: string, b: string): Promise<boolean> {
  const enc = new TextEncoder();
  const [ah, bh] = await Promise.all([
    crypto.subtle.digest("SHA-256", enc.encode(a)),
    crypto.subtle.digest("SHA-256", enc.encode(b)),
  ]);
  const av = new Uint8Array(ah);
  const bv = new Uint8Array(bh);
  let diff = 0;
  for (let i = 0; i < av.length; i++) diff |= av[i] ^ bv[i];
  return diff === 0;
}

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
  const auth = request.headers.get("authorization") ?? "";
  // Fail closed and respond uniformly: whether the secret is unset or merely
  // wrong, return 401 so a prober can't distinguish "not configured" from
  // "wrong secret". Compare in constant time to avoid a timing oracle.
  if (!secret) {
    console.error("[cron/check-sessions] CRON_SECRET is not configured — endpoint locked");
    return json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!(await timingSafeEqual(auth, `Bearer ${secret}`))) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const store = new CloudflareStore(env);
  const devices = await store.listDeviceSessions();

  const results = await Promise.allSettled(
    devices.map(async ({ deviceKey, did }) => {
      const check = await checkOAuthSession(env, store, did, deviceKey);
      // Only delete on a *confirmed* revocation. Transient failures return
      // "error" and are left untouched so a flaky run can't wipe live sessions.
      if (check.status === "revoked") {
        await store.delOAuthSession(store.oauthSessionKey(deviceKey, did));
        await store.removeDeviceSession(deviceKey);
        // Prune the user from the registry once their last device is gone.
        if ((await store.countDeviceSessions(did)) === 0) {
          await store.removeUser(did);
        }
        return "revoked" as const;
      }
      if (check.status === "error") {
        console.warn(`[cron/check-sessions] transient error for ${deviceKey}/${did}:`, check.error);
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
    `[cron/check-sessions] checked=${devices.length} valid=${valid} revoked=${revoked} errored=${errored}`
  );
  return json({ checked: devices.length, valid, revoked, errored });
};
