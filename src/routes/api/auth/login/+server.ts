import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { z } from "zod";
import { createOAuthClient, OAUTH_SCOPE, LEGACY_OAUTH_SCOPE } from "$lib/oauth.server.js";
import { safeNext } from "$lib/loginNext.js";
import { fail, readJson } from "$lib/api.server.js";

const BSKY_ENTRYWAY = "https://bsky.social";

const loginSchema = z.object({
  handle: z.string().min(1).max(255).optional(),
  next: z.string().max(512).optional(),
  addAccount: z.boolean().optional(),
});

export const POST: RequestHandler = async ({ request, platform, locals }) => {
  try {
    const env = platform!.env;
    const data = await readJson(request, loginSchema);
    if (!data) return fail(400, "ハンドルを正しく入力してください");

    const { handle, next, addAccount } = data;
    const client = await createOAuthClient(env, locals.store!);
    const authorize = (scope: string) =>
      client.authorize(handle ?? BSKY_ENTRYWAY, {
        scope,
        state: safeNext(next),
        prompt: addAccount ? "select_account" : undefined,
      });
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
      return fail(404, "ハンドルが見つかりませんでした。正しいハンドルか確認してください。");
    }
    return fail(500, "サーバーでエラーが起きました");
  }
};
