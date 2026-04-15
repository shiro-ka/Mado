/**
 * Spike entry worker. Dispatches to the Step 1 / Step 2 smoke tests.
 *
 * Deploy with: wrangler dev --config wrangler.spike.toml
 * (A dedicated spike wrangler config keeps this separate from the OpenNext
 *  worker used in Step 3.)
 */
import { installRedirectShim } from "./redirect-shim";
installRedirectShim();

import { eciesSmoke } from "./ecies-smoke";
import { oauthSmoke } from "./oauth-smoke";
import { runtimeProbe } from "./runtime-probe";

export interface SpikeEnv {
  OAUTH_PRIVATE_KEYS: string;
  NEXT_PUBLIC_APP_URL: string;
}

export default {
  async fetch(req: Request, env: SpikeEnv): Promise<Response> {
    const url = new URL(req.url);

    if (url.pathname === "/spike/runtime") {
      return Response.json(runtimeProbe());
    }

    if (url.pathname === "/spike/ecies") {
      const r = await eciesSmoke();
      return Response.json(r, { status: r.ok ? 200 : 500 });
    }

    if (url.pathname === "/spike/oauth") {
      const handle = url.searchParams.get("handle") ?? "bsky.app";
      const r = await oauthSmoke(env, handle);
      return Response.json(r, { status: r.ok ? 200 : 500 });
    }

    return new Response(
      "Spike worker.\n\nRoutes:\n  GET /spike/ecies\n  GET /spike/oauth?handle=<handle>\n",
      { headers: { "content-type": "text/plain" } }
    );
  },
};
