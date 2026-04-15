/**
 * Step 2 smoke test — @atproto/oauth-client-node on Cloudflare Workers.
 *
 * Pass criteria:
 *  - The module imports without throwing under nodejs_compat
 *  - `client.authorize(handle)` returns a PAR URL and writes OAuth state to the store
 *
 * Run via the spike worker: GET /spike/oauth?handle=<handle.bsky.social>
 *
 * Notes:
 *  - Uses an in-memory store here (not KV) to isolate the Node-compat question
 *    from the storage question. Step 4 validates KV-backed stores.
 *  - Requires OAUTH_PRIVATE_KEYS and NEXT_PUBLIC_APP_URL in .dev.vars.
 */

type Env = {
  OAUTH_PRIVATE_KEYS: string;
  NEXT_PUBLIC_APP_URL: string;
};

export async function oauthSmoke(
  env: Env,
  handle: string
): Promise<{ ok: boolean; report: Record<string, unknown> }> {
  const report: Record<string, unknown> = {};
  try {
    const { OAuthClient, AtprotoDohHandleResolver } = await import("@atproto/oauth-client-node");
    const { JoseKey } = await import("@atproto/jwk-jose");

    const rawKeys = JSON.parse(env.OAUTH_PRIVATE_KEYS) as unknown[];
    const keys = await Promise.all(rawKeys.map((k) => JoseKey.fromJWK(k as Parameters<typeof JoseKey.fromJWK>[0])));

    const memState = new Map<string, string>();
    const memSession = new Map<string, string>();
    const appUrl = env.NEXT_PUBLIC_APP_URL;

    const workerFetch: typeof fetch = (input, init) => {
      if (init && init.redirect === "error") {
        return fetch(input, { ...init, redirect: "manual" });
      }
      return fetch(input, init);
    };

    const client = new OAuthClient({
      fetch: workerFetch,
      handleResolver: new AtprotoDohHandleResolver({
        dohEndpoint: "https://cloudflare-dns.com/dns-query",
        fetch: workerFetch,
      }),
      responseMode: "query",
      runtimeImplementation: {
        createKey: (algs) => JoseKey.generate(algs),
        getRandomValues: (n: number) => crypto.getRandomValues(new Uint8Array(n)),
        digest: async (bytes, algorithm) => {
          const algName = algorithm.name.toUpperCase().replace(/^SHA/, "SHA-");
          const buf = await crypto.subtle.digest(algName, bytes);
          return new Uint8Array(buf);
        },
      },
      clientMetadata: {
        client_id: `${appUrl}/api/oauth/client-metadata.json`,
        client_name: "Mado (spike)",
        client_uri: appUrl,
        redirect_uris: [`${appUrl}/api/auth/callback`],
        grant_types: ["authorization_code", "refresh_token"],
        response_types: ["code"],
        scope: "atproto transition:generic",
        application_type: "web",
        token_endpoint_auth_method: "private_key_jwt",
        token_endpoint_auth_signing_alg: "ES256",
        dpop_bound_access_tokens: true,
        jwks_uri: `${appUrl}/api/oauth/jwks.json`,
      } as never,
      allowHttp: true,
      keyset: keys,
      stateStore: {
        async set(k, v) {
          memState.set(k, JSON.stringify(v));
        },
        async get(k) {
          const raw = memState.get(k);
          return raw ? JSON.parse(raw) : undefined;
        },
        async del(k) {
          memState.delete(k);
        },
      },
      sessionStore: {
        async set(k, v) {
          memSession.set(k, JSON.stringify(v));
        },
        async get(k) {
          const raw = memSession.get(k);
          return raw ? JSON.parse(raw) : undefined;
        },
        async del(k) {
          memSession.delete(k);
        },
      },
    });
    report.clientInit = { ok: true };

    const url = await client.authorize(handle, { scope: "atproto transition:generic" });
    report.authorize = {
      ok: typeof url.toString() === "string" && url.toString().startsWith("http"),
      urlPreview: url.toString().slice(0, 80),
      stateCount: memState.size,
    };

    const ok = (report.authorize as { ok: boolean }).ok;
    return { ok, report };
  } catch (e) {
    report.error = String(e);
    report.stack = e instanceof Error ? e.stack : undefined;
    const causes: string[] = [];
    let cur: unknown = e;
    for (let i = 0; i < 10 && cur; i++) {
      const asErr = cur as { cause?: unknown; message?: string; name?: string };
      causes.push(`${asErr.name ?? "Error"}: ${asErr.message ?? String(cur)}`);
      cur = asErr.cause;
    }
    report.causeChain = causes;
    return { ok: false, report };
  }
}
