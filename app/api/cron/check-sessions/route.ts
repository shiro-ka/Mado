import { NextRequest, NextResponse } from "next/server";
import { getRedis, Keys } from "@/lib/redis";
import { restoreOAuthSession, clearOAuthSession } from "@/lib/oauth";

/**
 * GET /api/cron/check-sessions
 *
 * Verifies OAuth sessions for all registered Mado users.
 * For each user whose session is no longer valid (revoked or expired),
 * the stored OAuth session key is deleted from Redis. This causes
 * hasOAuthSession(did) to return false, which hides the question form
 * on public box pages until the owner re-authenticates.
 *
 * Protected by Authorization: Bearer {CRON_SECRET}.
 * Configured as a Vercel Cron job in vercel.json (runs daily).
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const redis = getRedis();
  const dids = await redis.smembers<string[]>(Keys.users);

  let valid = 0;
  let revoked = 0;

  for (const did of dids) {
    const sessionFetch = await restoreOAuthSession(did);
    if (sessionFetch) {
      valid++;
    } else {
      await clearOAuthSession(did);
      revoked++;
    }
  }

  console.log(`[cron/check-sessions] checked=${dids.length} valid=${valid} revoked=${revoked}`);
  return NextResponse.json({ checked: dids.length, valid, revoked });
}
