import type { RequestHandler } from "./$types";
import { CloudflareStore } from "$lib/store.js";
import { createOAuthClient } from "$lib/oauth.server.js";

export const GET: RequestHandler = async ({ platform }) => {
  const env = platform!.env;
  const store = new CloudflareStore(env);
  const client = await createOAuthClient(env, store);
  return Response.json(client.jwks, {
    headers: { "Cache-Control": "no-store" },
  });
};
