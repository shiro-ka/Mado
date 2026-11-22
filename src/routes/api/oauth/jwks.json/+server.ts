import type { RequestHandler } from "./$types";
import { createOAuthClient } from "$lib/oauth.server.js";

export const GET: RequestHandler = async ({ platform, locals }) => {
  const client = await createOAuthClient(platform!.env, locals.store!);
  return Response.json(client.jwks, {
    headers: { "Cache-Control": "no-store" },
  });
};
