import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { CloudflareStore } from "$lib/store.js";
import { getSession } from "$lib/auth.server.js";
import { restoreOAuthSession } from "$lib/oauth.server.js";
import { writeFollow, getViewerFollowsActor } from "$lib/atproto.js";
import { getOfficialAccount } from "$lib/notify.server.js";

// Follow the official Mado account on the caller's behalf. Deliberately does
// NOT touch the DM-notification toggle — following (a public social action) and
// enabling notifications (an app preference) are separate, equally-weighted
// decisions the user makes individually.
export const POST: RequestHandler = async ({ cookies, platform }) => {
  const env = platform!.env;
  const store = new CloudflareStore(env);
  const session = await getSession(cookies, store);
  if (!session) {
    return json(
      { error: "Unauthorized", message: "ログインが必要です" },
      { status: 401 }
    );
  }

  // Independent lookups — resolving the official account (handle→DID) and
  // restoring the caller's OAuth session don't depend on each other, so run
  // them together instead of paying two sequential round-trips.
  const [official, sessionFetch] = await Promise.all([
    getOfficialAccount(env),
    restoreOAuthSession(env, store, session.did, session.deviceKey),
  ]);
  if (!official) {
    return json(
      { error: "Unavailable", message: "通知は現在利用できません" },
      { status: 503 }
    );
  }
  if (!sessionFetch) {
    return json(
      { error: "Session expired", message: "再ログインしてください" },
      { status: 401 }
    );
  }

  // Idempotent: skip the write if already following (avoids duplicate records).
  if (await getViewerFollowsActor(sessionFetch, official.did)) {
    return json({ success: true, following: true });
  }

  const res = await writeFollow({
    sessionFetch,
    did: session.did,
    subjectDid: official.did,
  });
  if (!res) {
    return json(
      { error: "Follow failed", message: "フォローに失敗しました" },
      { status: 500 }
    );
  }

  return json({ success: true, following: true });
};
