import { installRedirectShim } from "$lib/redirect-shim";
import type { Handle } from "@sveltejs/kit";
import { CloudflareStore, type SessionEntry } from "$lib/store.js";
import { getSessionEntry } from "$lib/auth.server.js";

installRedirectShim();

export const handle: Handle = async ({ event, resolve }) => {
  const env = event.platform?.env;
  const store = env ? new CloudflareStore(env) : null;
  let entry: Promise<SessionEntry | undefined> | undefined;
  event.locals.store = store;
  event.locals.getSessionEntry = () =>
    (entry ??= store ? getSessionEntry(event.cookies, store) : Promise.resolve(undefined));
  event.locals.getSession = () => event.locals.getSessionEntry().then((e) => e?.session);
  return resolve(event);
};
