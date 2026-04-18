# Cloudflare 移行 Spike — 検証結果

**日付**: 2026-04-18  
**ブランチ**: `spike/cf-migration`  
**判定**: **完全 Go ✅**

---

## Step 1: ECIES 疎通 — ✅ Go

- `eciesjs` + `Buffer` が `nodejs_compat` で動作
- `generateKeyPair` / `encryptDid` / `decryptDid` 正常
- 10往復の暗号/復号エラーなし

## Step 2: OAuth 起動 — ✅ Go

- `@atproto/oauth-client` (base class) で Workers 動作確認
- `authorize()` が PAR URL を返却、KV への state 書込成功
- **注意点**: `NodeOAuthClient` は Worker 非対応。`OAuthClient` 基底クラスを直接使用し、`toDpopKeyStore` 相当の `wrapDpopStore` を手動実装する必要あり（後述）

## Step 3: SvelteKit + Vite ビルド — ✅ Go

- Next.js ではなく SvelteKit + `@sveltejs/adapter-cloudflare` に切り替え
- `vite build` 成功、`wrangler pages deploy` で Cloudflare Pages 稼働
- **採用**: `@opennextjs/cloudflare` ではなく SvelteKit ネイティブ Cloudflare adapter

## Step 4: KV/D1 疎通 — ✅ Go

- KV: oauth_state (TTL), mado_session (TTL), rate limiting — 全項目 ok
- D1: users, keypairs, blocks, reads, sent, sent_reads — 全テーブル正常
- `/spike/store` エンドポイントで全項目 `ok: true` 確認済み

## Step 5: E2E OAuth ログイン — ✅ Go

- `https://spike-cf-migration.mado-sveltekit.pages.dev` でリアル Bluesky アカウントによる OAuth ログイン成功
- callback → KV session 保存 → `/dashboard` リダイレクト 確認
- **解決した課題**: `dpopKey` の KV シリアライズ問題

---

## 重要な実装メモ

### dpopKey シリアライズ問題 (必須対応)

`JoseKey` はクラスインスタンスで `algorithms` ゲッターを持つ。  
KV に `JSON.stringify` → `JSON.parse` するとゲッターが消え、callback 時に  
`Cannot read properties of undefined (reading 'includes')` でクラッシュする。

**対処**: `wrapDpopStore` 関数で `stateStore` / `sessionStore` をラップ:
- **write**: `dpopKey.privateJwk`（プレーン JWK）だけ保存
- **read**: `JoseKey.fromJWK(dpopJwk)` でクラスインスタンスを再構築

実装は `src/lib/oauth.server.ts` の `wrapDpopStore` 参照。

### Cloudflare Pages secrets

- production / preview 環境は**別々**に `--env preview` フラグで設定が必要
- secrets 設定後は**再デプロイが必須**（既存デプロイには反映されない）
- `APP_URL` はハッシュ URL ではなく安定エイリアス URL を使うこと  
  例: `https://spike-cf-migration.mado-sveltekit.pages.dev`

---

## 次フェーズ (本移行計画)

1. **DNS カットオーバー**: `mado.blue` を Cloudflare Pages にポイント
2. **データ移行**: Upstash → KV/D1 (ECIES 秘密鍵、セッション、ユーザーリスト等)
3. **両書き期間**: `DualWriteAdapter` で Upstash + Cloudflare 同時書込、段階カットオーバー
4. **本番 SvelteKit 実装**: 既存 Next.js アプリの全機能を SvelteKit に移植

---

## Cloudflare リソース (spike 環境)

- **Pages**: `mado-sveltekit` (production branch: `main`)
- **KV**: `MADO_KV`, `MADO_OAUTH_STATE`, `MADO_OAUTH_SESSIONS`, `MADO_RATE`
- **D1**: `mado` (6テーブル, migration `0001_init.sql` 適用済み)
