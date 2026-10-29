import type { RequestHandler } from "./$types";
import { CloudflareStore } from "$lib/store.js";
import { switchAccount } from "$lib/auth.server.js";
import { didSchema } from "$lib/validation.js";

export const POST: RequestHandler = async ({ request, cookies, platform }) => {
  const env = platform!.env;
  const appUrl = env.APP_URL ?? "https://mado.blue";
  const form = await request.formData().catch(() => null);
  const did = didSchema.safeParse(form?.get("did"));
  if (did.success) await switchAccount(cookies, env, new CloudflareStore(env), did.data);
  return new Response(null, { status: 303, headers: { Location: `${appUrl}/receive` } });
};
