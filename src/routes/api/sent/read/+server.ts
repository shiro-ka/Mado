import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { z } from "zod";
import { CloudflareStore } from "$lib/store.js";
import { getSession } from "$lib/auth.server.js";

const schema = z.object({
  ownerDid: z.string().min(1),
  koeRkey: z.string().min(1),
});

export const POST: RequestHandler = async ({ request, cookies, platform }) => {
  try {
    const env = platform!.env;
    const store = new CloudflareStore(env);
    const session = await getSession(cookies, store);
    if (!session) return json({ error: "Unauthorized" }, { status: 401 });

    const raw = await request.json();
    const parsed = schema.safeParse(raw);
    if (!parsed.success) return json({ error: "Invalid request" }, { status: 400 });

    const { ownerDid, koeRkey } = parsed.data;
    await store.markSentRead(session.did, `${ownerDid}:${koeRkey}`);
    return json({ success: true });
  } catch {
    return json({ error: "Internal server error" }, { status: 500 });
  }
};
