import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { CloudflareStore } from "$lib/store.js";
import { getSession } from "$lib/auth.server.js";
import { rkeySchema } from "$lib/validation.js";

async function handle(
  { params, cookies, platform }: Parameters<RequestHandler>[0],
  handled: boolean,
) {
  const store = new CloudflareStore(platform!.env);
  const session = await getSession(cookies, store);
  if (!session) return json({ error: "Unauthorized" }, { status: 401 });
  const rkey = rkeySchema.safeParse(params.rkey);
  if (!rkey.success) return json({ error: "Invalid request" }, { status: 400 });
  if (handled) await store.markHandled(session.did, rkey.data);
  else await store.unmarkHandled(session.did, rkey.data);
  return json({ ok: true });
}

export const POST: RequestHandler = (event) => handle(event, true);
export const DELETE: RequestHandler = (event) => handle(event, false);
