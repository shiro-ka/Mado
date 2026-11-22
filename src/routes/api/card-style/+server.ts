import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { z } from "zod";
import { fail, readJson, withSession } from "$lib/api.server.js";
import { CARD_SLOTS, colorSchema, type CardStyleDoc } from "$lib/cardStyle.js";

const requestSchema = z.object(Object.fromEntries(CARD_SLOTS.map((slot) => [slot, colorSchema.nullable()])));

export const POST: RequestHandler = (event) =>
  withSession(event, async ({ store, session }) => {
    const data = await readJson(event.request, requestSchema);
    if (!data) return fail(400, "色の指定を確認してください");

    const doc: CardStyleDoc = {};
    for (const slot of CARD_SLOTS) {
      const value = data[slot];
      if (value) doc[slot] = { kind: "color", value: value.toLowerCase() };
    }
    const updatedAt = await store.setCardStyle(session.did, doc);
    return json({ updatedAt });
  });
