import { installRedirectShim } from "$lib/redirect-shim";
import type { Handle } from "@sveltejs/kit";
import { CloudflareStore, type SessionEntry } from "$lib/store.js";
import { getSessionEntry } from "$lib/auth.server.js";
import { timingEnabled, wrapEnv, wrapGlobalFetch, traced } from "$lib/timing.server.js";

installRedirectShim();
wrapGlobalFetch();

export const handle: Handle = async ({ event, resolve }) => {
  const timing = timingEnabled(event.platform?.env);
  if (timing && event.platform) Object.assign(event.platform, { env: wrapEnv(event.platform.env) });
  const env = event.platform?.env;
  const store = env ? new CloudflareStore(env) : null;
  let entry: Promise<SessionEntry | undefined> | undefined;
  event.locals.store = store;
  event.locals.getSessionEntry = () =>
    (entry ??= store ? getSessionEntry(event.cookies, store) : Promise.resolve(undefined));
  event.locals.getSession = () => event.locals.getSessionEntry().then((e) => e?.session);
  if (!timing) return resolve(event);
  return traced(`${event.request.method} ${event.url.pathname}`, async () => resolve(event));
};
