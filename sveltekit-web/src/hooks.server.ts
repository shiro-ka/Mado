import { installRedirectShim } from "$lib/redirect-shim";

// Must run before any @atproto/oauth-client-node code is loaded.
installRedirectShim();
