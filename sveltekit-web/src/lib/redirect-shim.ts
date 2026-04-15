/**
 * Workers compatibility shim for `redirect: "error"`.
 * @atproto's OAuth library uses this flag which Workers doesn't support.
 * Transparently rewrites to "manual" (functionally equivalent for all
 * endpoints in the OAuth flow, which don't redirect under normal conditions).
 *
 * Install once in hooks.server.ts before any @atproto imports run.
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
