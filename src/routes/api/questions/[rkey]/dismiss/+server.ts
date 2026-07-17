import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { CloudflareStore } from "$lib/store.js";
import { getSession } from "$lib/auth.server.js";

// POST   → スルーする（未返信リストから外す）
// DELETE → スルーを解除して未返信に戻す
// Only touches D1; the koe record itself is untouched.

export const POST: RequestHandler = async ({ params, cookies, platform }) => {
  const store = new CloudflareStore(platform!.env);
  const session = await getSession(cookies, store);
  if (!session) return json({ error: "Unauthorized" }, { status: 401 });

  await store.markDismissed(session.did, params.rkey);
  return json({ ok: true });
};

export const DELETE: RequestHandler = async ({ params, cookies, platform }) => {
  const store = new CloudflareStore(platform!.env);
  const session = await getSession(cookies, store);
  if (!session) return json({ error: "Unauthorized" }, { status: 401 });

  await store.unmarkDismissed(session.did, params.rkey);
  return json({ ok: true });
};
