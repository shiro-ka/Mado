import type { RequestHandler } from "./$types";
import { OAuthClient, AtprotoDohHandleResolver } from "@atproto/oauth-client-node";
import { JoseKey } from "@atproto/jwk-jose";

export const GET: RequestHandler = async ({ url, platform }) => {
  const handle = url.searchParams.get("handle") ?? "jay.bsky.team";
  const appUrl = platform?.env?.NEXT_PUBLIC_APP_URL ?? "https://mado.blue";
  const rawKeys = platform?.env?.OAUTH_PRIVATE_KEYS ?? "[]";

  const report: Record<string, unknown> = {};

  try {
    const keys = await Promise.all(
      (JSON.parse(rawKeys) as Record<string, unknown>[]).map((k) => JoseKey.fromJWK(k))
    );

    const memState = new Map<string, string>();
    const memSession = new Map<string, string>();

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
          const name = algorithm.name.toUpperCase().replace(/^SHA/, "SHA-");
          return new Uint8Array(await crypto.subtle.digest(name, bytes));
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
        async set(k, v) { memState.set(k, JSON.stringify(v)); },
        async get(k) { const r = memState.get(k); return r ? JSON.parse(r) : undefined; },
        async del(k) { memState.delete(k); },
      },
      sessionStore: {
        async set(k, v) { memSession.set(k, JSON.stringify(v)); },
        async get(k) { const r = memSession.get(k); return r ? JSON.parse(r) : undefined; },
        async del(k) { memSession.delete(k); },
      },
    });
    report.clientInit = { ok: true };

    const authUrl = await client.authorize(handle, { scope: "atproto transition:generic" });
    report.authorize = {
      ok: true,
      urlPreview: authUrl.toString().slice(0, 80),
      stateCount: memState.size,
    };

    return Response.json({ ok: true, report }, { status: 200 });
  } catch (e) {
    const causes: string[] = [];
    let cur: unknown = e;
    for (let i = 0; i < 5 && cur; i++) {
      const err = cur as { cause?: unknown; message?: string; name?: string };
      causes.push(`${err.name ?? "Error"}: ${err.message ?? String(cur)}`);
      cur = err.cause;
    }
    report.error = String(e);
    report.causeChain = causes;
    return Response.json({ ok: false, report }, { status: 500 });
  }
};
