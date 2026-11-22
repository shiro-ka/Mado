import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { z } from "zod";
import { CloudflareStore } from "$lib/store.js";
import { getSession } from "$lib/auth.server.js";
import { CARD_SLOTS, colorSchema, type CardStyleDoc } from "$lib/cardStyle.js";

const requestSchema = z.object(Object.fromEntries(CARD_SLOTS.map((slot) => [slot, colorSchema.nullable()])));

export const POST: RequestHandler = async ({ request, cookies, platform }) => {
  const store = new CloudflareStore(platform!.env);
  const session = await getSession(cookies, store);
  if (!session) {
    return json({ error: "Unauthorized", message: "ログインが必要です" }, { status: 401 });
  }

  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return json({ error: "Invalid request", message: "色の指定を確認してください" }, { status: 400 });
  }

  const doc: CardStyleDoc = {};
  for (const slot of CARD_SLOTS) {
    const value = parsed.data[slot];
    if (value) doc[slot] = { kind: "color", value: value.toLowerCase() };
  }
  const updatedAt = await store.setCardStyle(session.did, doc);
  return json({ success: true, updatedAt });
};
