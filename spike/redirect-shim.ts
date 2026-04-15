/**
 * Workers compatibility shim for `redirect: "error"`.
 *
 * Cloudflare Workers does not implement `RequestInit.redirect = "error"`
 * (it throws at Request construction time). @atproto's OAuth library uses
 * this flag to reject redirects on metadata / resolver fetches.
 *
 * "manual" is functionally close enough for our use: the response is surfaced
 * as a 3xx and the library can inspect the status code. None of the endpoints
 * the OAuth flow hits (client metadata, .well-known, PLC directory, PAR,
 * token) are expected to redirect in normal operation.
 *
 * Install once at worker startup, BEFORE importing @atproto/oauth-client-node.
 */
export function installRedirectShim(): void {
  const OrigRequest = globalThis.Request;
  const Patched = new Proxy(OrigRequest, {
    construct(target, args: [RequestInfo, RequestInit?]) {
      const [input, init] = args;
      if (init && init.redirect === "error") {
        return Reflect.construct(target, [input, { ...init, redirect: "manual" }]);
      }
      return Reflect.construct(target, args);
    },
  });
  globalThis.Request = Patched as typeof globalThis.Request;
}
