/// <reference types="@vite-pwa/sveltekit" />

declare global {
  namespace App {
    interface Platform {
      env: {
        OAUTH_STATE: KVNamespace;
        OAUTH_SESSION: KVNamespace;
        MADO_SESSION: KVNamespace;
        RATE_LIMIT: KVNamespace;
        DB: D1Database;
        OAUTH_PRIVATE_KEYS: string;
        APP_URL: string;
        CRON_SECRET: string;
        // Official Mado account used for opt-in DM notifications. When unset,
        // notifications are silently skipped. The app password must have DM
        // access enabled. MADO_OFFICIAL_PDS defaults to https://bsky.social.
        MADO_OFFICIAL_IDENTIFIER?: string;
        MADO_OFFICIAL_APP_PASSWORD?: string;
        MADO_OFFICIAL_PDS?: string;
        // Public handle of the official account (drives the opt-in UI / follow
        // link). Resolved to a DID at runtime for follow detection & writes.
        MADO_OFFICIAL_HANDLE?: string;
      };
      cf: CfProperties;
      ctx: ExecutionContext;
    }
  }
}

export {};
