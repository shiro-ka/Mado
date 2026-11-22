import type { RequestHandler } from "./$types";
import { switchAccount } from "$lib/auth.server.js";
import { appOrigin } from "$lib/api.server.js";
import { didSchema } from "$lib/validation.js";

export const POST: RequestHandler = async ({ request, cookies, platform, locals }) => {
  const env = platform!.env;
  const form = await request.formData().catch(() => null);
  const did = didSchema.safeParse(form?.get("did"));
  if (did.success) await switchAccount(cookies, env, locals.store!, did.data);
  return new Response(null, { status: 303, headers: { Location: `${appOrigin(env)}/receive` } });
};
