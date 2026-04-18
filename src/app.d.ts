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
      };
      cf: CfProperties;
      ctx: ExecutionContext;
    }
  }
}

export {};
