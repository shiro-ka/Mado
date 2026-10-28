import type { Handle } from "@sveltejs/kit";
import { kvTiming } from "$lib/store.js";
import { installRedirectShim } from "$lib/redirect-shim";

// Must run before any @atproto/oauth-client-node code is loaded.
installRedirectShim();

export const handle: Handle = async ({ event, resolve }) => {
  kvTiming.length = 0;
  const t = Date.now();
  const res = await resolve(event);
  try {
    res.headers.set("Server-Timing", [...kvTiming, `total;dur=${Date.now() - t}`].join(", "));
  } catch {
    return res;
  }
  return res;
};
