import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { z } from "zod";
import { CloudflareStore } from "$lib/store.js";
import { createOAuthClient, OAUTH_SCOPE, LEGACY_OAUTH_SCOPE } from "$lib/oauth.server.js";
import { safeNext } from "$lib/loginNext.js";

const BSKY_ENTRYWAY = "https://bsky.social";

const loginSchema = z.object({
  handle: z.string().min(1).max(255).optional(),
  next: z.string().max(512).optional(),
});

export const POST: RequestHandler = async ({ request, platform }) => {
  try {
    const env = platform!.env;
    const body = await request.json().catch(() => null);
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return json(
        { error: "Invalid request", message: "ハンドルを正しく入力してください" },
        { status: 400 }
      );
    }

    const { handle, next } = parsed.data;
    const store = new CloudflareStore(env);
    const client = await createOAuthClient(env, store);
    const authorize = (scope: string) =>
      client.authorize(handle ?? BSKY_ENTRYWAY, { scope, state: safeNext(next) });
    const url = await authorize(OAUTH_SCOPE).catch((err) => {
      if (!(err instanceof Error && err.message.includes("invalid_scope"))) throw err;
      console.warn("[/api/auth/login] granular scope rejected, falling back", err.message);
      return authorize(LEGACY_OAUTH_SCOPE);
    });

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
