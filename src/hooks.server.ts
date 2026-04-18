import { installRedirectShim } from "$lib/redirect-shim";

// Must run before any @atproto/oauth-client-node code is loaded.
installRedirectShim();

import type { Handle } from "@sveltejs/kit";

// Rewrite /@handle and /@handle/slug to /u/@handle and /u/@handle/slug,
// mirroring the Next.js middleware rewrite for clean public profile URLs.
export const handle: Handle = async ({ event, resolve }) => {
  if (/^\/@[^/]/.test(event.url.pathname)) {
    event.url.pathname = `/u${event.url.pathname}`;
  }
  return resolve(event);
};
