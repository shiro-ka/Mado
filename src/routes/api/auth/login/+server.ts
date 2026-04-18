import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { z } from "zod";
import { CloudflareStore } from "$lib/store.js";
import { createOAuthClient } from "$lib/oauth.server.js";

const loginSchema = z.object({
  handle: z.string().min(1).max(255),
});

export const POST: RequestHandler = async ({ request, platform }) => {
  try {
    const env = platform!.env;
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return json(
        { error: "Invalid request", message: "ハンドルを正しく入力してください" },
        { status: 400 }
      );
    }

    const { handle } = parsed.data;
    const store = new CloudflareStore(env);
    const client = await createOAuthClient(env, store);
    const url = await client.authorize(handle, { scope: "atproto transition:generic" });

    return json({ redirectUrl: url.toString() });
  } catch (err) {
    console.error("[/api/auth/login]", err);
    const msg = err instanceof Error ? err.message : "";
    if (
      msg.includes("NXDOMAIN") ||
      msg.includes("resolve") ||
      msg.includes("not found")
    ) {
      return json(
        {
          error: "Handle not found",
          message: "ハンドルが見つかりませんでした。正しいハンドルか確認してください。",
        },
        { status: 404 }
      );
    }
    return json(
      { error: "Internal server error", message: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
};
