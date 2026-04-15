# Cloudflare 移行検証 — 最終結果

検証ブランチ: `spike/cf-migration`
完了日: 2026-04-16

## 判定: 完全 GO ✅

SvelteKit + Cloudflare Pages + KV/D1 への移行を推奨。

---

## 方針

当初の「Next.js + OpenNext で Cloudflare 移行」から「SvelteKit + `@sveltejs/adapter-cloudflare` への完全書き換え」に変更（ユーザー判断：サイト規模が小さく移行コストが低いうちに）。

---

## Step 1: ECIES + Buffer on Workers — ✅ GO

- `wrangler pages dev` で `/spike/ecies` が 200 (SvelteKit ルート)
- `new PrivateKey()`、`PrivateKey.fromHex()` rehydrate、10往復の encrypt/decrypt がすべて成功
- `Buffer.from(x).toString("hex" / "base64")` は `nodejs_compat` で問題なし
- **検証環境**: `compatibility_date = "2025-10-01"`, `nodejs_compat` フラグ必須

## Step 2: @atproto OAuth on Workers — ✅ GO

### 課題と解決レシピ

| 課題 | 解決 |
|------|------|
| `WeakRef is not defined` | `compatibility_date = "2025-10-01"` 以降が必要（`2024-11-06` では未定義） |
| `NodeOAuthClient` が Node 専用 DNS resolver を内包 | 基底 `OAuthClient` + `AtprotoDohHandleResolver` を使う |
| `new Request(url, { redirect: "error" })` が Workers でスロー | `Request` コンストラクタを Proxy で wrap、`"error"` → `"manual"` に透過変換 |
| `runtimeImplementation` が Node crypto を要求 | `crypto.getRandomValues` + `crypto.subtle.digest` で差し替え |

### 確認事項

- SvelteKit `hooks.server.ts` で `installRedirectShim()` をインポート冒頭に配置 ✓
- OAuthClient 構築成功 (`clientInit: { ok: true }`) ✓
- 認証サーバー (bsky.social PDS) への PAR リクエスト到達 ✓
- `invalid_client` はスパイク用テスト鍵が mado.blue 公開 JWKS に含まれていないため（期待通り）

## Step 3': SvelteKit + adapter-cloudflare ビルド — ✅ GO

- `npm run build` が `@sveltejs/adapter-cloudflare` で正常完了
- `wrangler pages dev .svelte-kit/cloudflare` で ECIES・OAuth 両ルートが動作
- Cloudflare Pages 固有の環境変数 (`CF_PAGES`, `CF_PAGES_BRANCH` 等) が自動注入されることを確認

---

## 採用した recipe（本実装時に流用）

### wrangler.toml

```toml
compatibility_date = "2025-10-01"
compatibility_flags = ["nodejs_compat"]
```

### src/hooks.server.ts

```ts
import { installRedirectShim } from "$lib/redirect-shim";
installRedirectShim(); // @atproto 系インポートより前
```

### OAuthClient 構築 (src/lib/oauth.server.ts)

```ts
import { OAuthClient, AtprotoDohHandleResolver } from "@atproto/oauth-client-node";
import { JoseKey } from "@atproto/jwk-jose";

const workerFetch: typeof fetch = (input, init) =>
  fetch(input, init?.redirect === "error" ? { ...init, redirect: "manual" } : init);

export function createOAuthClient(env: App.Platform["env"]) {
  return new OAuthClient({
    fetch: workerFetch,
    handleResolver: new AtprotoDohHandleResolver({
      dohEndpoint: "https://cloudflare-dns.com/dns-query",
      fetch: workerFetch,
    }),
    responseMode: "query",
    runtimeImplementation: {
      createKey: (algs) => JoseKey.generate(algs),
      getRandomValues: (n) => crypto.getRandomValues(new Uint8Array(n)),
      digest: async (bytes, alg) => {
        const name = alg.name.toUpperCase().replace(/^SHA/, "SHA-");
        return new Uint8Array(await crypto.subtle.digest(name, bytes));
      },
    },
    clientMetadata: { /* ... */ } as never,
    keyset: /* JoseKey[] from env.OAUTH_PRIVATE_KEYS */,
    stateStore: /* KV-backed */,
    sessionStore: /* KV-backed */,
  });
}
```

---

## ストレージ設計（本実装時）

[詳細は spike 計画書参照](../spike/RESULTS.md) ← 計画段階で決定済みの KV + D1 マッピング

| 用途 | バックエンド |
|------|------------|
| OAuth state (TTL 10分) | KV (`expirationTtl`) |
| OAuth session (永続) | KV |
| アプリセッション (TTL 30日) | KV |
| ECIES 秘密鍵 | D1 |
| ブロックリスト / 既読 / 送信履歴 | D1 |
| レート制限カウンタ | KV |
| 全ユーザーリスト (cron 用) | D1 (`SELECT did FROM users`) |

---

## 本移行フェーズ（次のステップ）

1. Cloudflare KV namespaces を作成 (`wrangler kv namespace create`)
2. D1 database を作成 (`wrangler d1 create mado`)、`migrations/0001_init.sql` を適用
3. `sveltekit-web/src/lib/store.ts` — KV/D1 実装 (`lib/store.ts` の `MadoStore` インターフェースを活用)
4. `sveltekit-web/src/lib/oauth.server.ts` — 上記 recipe で OAuth client 実装
5. API ルート移植: `app/api/**` (13本) → `sveltekit-web/src/routes/api/**`
6. UI 移植: React コンポーネント → Svelte 5 コンポーネント (`lucide-react` → `lucide-svelte`、Tailwind v4 はそのまま)
7. Vercel cron → Cloudflare Workers Cron Triggers (wrangler.toml の `triggers.crons`)
8. Cloudflare Pages にデプロイ (GitHub 連携 or `wrangler pages deploy`)
9. DNS カットオーバー: `mado.blue` を Cloudflare Pages に向ける
10. 両書き期間後 Upstash / Vercel アカウント廃止

---

## スコープ・工数目安

SvelteKit への書き換えが加わるため当初計画より大きいが、Workers 適合性は完全確認済み。

| フェーズ | 内容 | 目安 |
|---------|------|------|
| ストレージ層 | KV/D1 + MadoStore 実装 | 1–2日 |
| API 移植 | 13 ルート | 2–3日 |
| UI 移植 | pages + components | 3–5日 |
| 統合・E2E | OAuth 完全フロー + cron | 1–2日 |
| デプロイ | CF Pages 設定 + DNS 切替 | 半日 |
