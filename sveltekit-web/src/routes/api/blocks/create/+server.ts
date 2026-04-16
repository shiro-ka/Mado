import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { z } from "zod";
import { CloudflareStore } from "$lib/store.js";
import { getSession } from "$lib/auth.server.js";

const schema = z.object({ senderDid: z.string().min(1) });

export const POST: RequestHandler = async ({ request, cookies, platform }) => {
  try {
    const env = platform!.env;
    const store = new CloudflareStore(env);
    const session = await getSession(cookies, store);
    if (!session) {
      return json(
        { error: "Unauthorized", message: "ログインが必要です" },
        { status: 401 }
      );
    }

    const raw = await request.json();
    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      return json(
        { error: "Invalid request", message: "入力内容を確認してください" },
        { status: 400 }
      );
    }

    const { senderDid } = parsed.data;
    if (senderDid === session.did) {
      return json(
        { error: "Bad request", message: "自分自身をブロックすることはできません" },
        { status: 400 }
      );
    }

    await store.addBlock(session.did, senderDid);
    return json({ success: true });
  } catch (err) {
    console.error("[/api/blocks/create]", err);
    return json(
      { error: "Internal server error", message: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
};
