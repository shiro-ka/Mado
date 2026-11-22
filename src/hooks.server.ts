import { installRedirectShim } from "$lib/redirect-shim";
import type { Handle } from "@sveltejs/kit";
import { CloudflareStore, type AppSession } from "$lib/store.js";
import { getSession } from "$lib/auth.server.js";

installRedirectShim();

export const handle: Handle = async ({ event, resolve }) => {
  const env = event.platform?.env;
  const store = env ? new CloudflareStore(env) : null;
  let session: Promise<AppSession | undefined> | undefined;
  event.locals.store = store;
  event.locals.getSession = () =>
    (session ??= store ? getSession(event.cookies, store) : Promise.resolve(undefined));
  return resolve(event);
};
