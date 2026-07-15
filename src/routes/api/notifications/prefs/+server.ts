import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { z } from "zod";
import { CloudflareStore } from "$lib/store.js";
import { getSession } from "$lib/auth.server.js";

// Notification preferences for the logged-in user. The future settings UI reads
// GET and writes POST; the send pipeline reads store.isDmNotifyEnabled().

export const GET: RequestHandler = async ({ cookies, platform }) => {
  const store = new CloudflareStore(platform!.env);
  const session = await getSession(cookies, store);
  if (!session) {
    return json(
      { error: "Unauthorized", message: "ログインが必要です" },
      { status: 401 }
    );
  }
  const prefs = await store.getNotificationPrefs(session.did);
  return json(prefs);
};

const prefsSchema = z.object({ dmEnabled: z.boolean() });

export const POST: RequestHandler = async ({ request, cookies, platform }) => {
  const store = new CloudflareStore(platform!.env);
  const session = await getSession(cookies, store);
  if (!session) {
    return json(
      { error: "Unauthorized", message: "ログインが必要です" },
      { status: 401 }
    );
  }

  const parsed = prefsSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return json(
      { error: "Invalid request", message: "入力内容を確認してください" },
      { status: 400 }
    );
  }

  await store.setDmNotify(session.did, parsed.data.dmEnabled);
  return json({ success: true, dmEnabled: parsed.data.dmEnabled });
};
