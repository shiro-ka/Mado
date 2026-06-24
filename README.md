# Mado（窓）

半匿名メッセージ箱 @ Bluesky / atproto。マシュマロのような質問箱だが、**「半匿名」** という尖った特徴を持つ。

## 「半匿名」とは

質問（`blue.mado.koe`）は **箱の所有者のリポジトリ** に書き込まれ、

- **本文（body）は PDS 上で公開** — 誰でも読める
- **送信者の DID は ECIES で暗号化**（`encryptedFrom`）され、**箱の所有者だけが復号できる**

つまり「誰が送ったか」は一般公開されないが、受け取った本人には分かる。質問は送信者ではなく所有者のリポジトリに書かれるため、送信者のリポジトリには痕跡が残らない。

> **トラストモデル（開発者向けの事実）**: サーバー（D1）は各箱の ECIES 秘密鍵（`keypairs.private_hex`）と送信履歴（`sent`：送信者 DID・本文）を平文で保持する。したがって匿名性は「他の Bluesky ユーザーに対して」成立するもので、運営者に対するものではない。ユーザー向けの開示文言は別途整備すること（TODO）。

## 技術スタック

- **SvelteKit 2 / Svelte 5** + **Tailwind v4** + shadcn-svelte（bits-ui）
- **Cloudflare Pages**（`@sveltejs/adapter-cloudflare`）+ **KV** + **D1**
- 認証: **atproto OAuth**（DPoP / `private_key_jwt`）— `@atproto/oauth-client-node` を Workers 向けに調整（`src/lib/oauth.server.ts`）
- 暗号: **eciesjs**（secp256k1 ECIES）
- OGP 画像: **@cf-wasm/og**（日本語フォント動的生成）

## データの置き場所

| データ | 保存先 | 備考 |
|---|---|---|
| 質問箱 `blue.mado.box` / 質問 `blue.mado.koe` / 回答 `blue.mado.answer` | 各 PDS のレコード | lexicon は `lexicons/` |
| OAuth state / OAuth session / アプリセッション / レート制限 | Cloudflare KV | バインディングは `wrangler.toml` |
| ユーザー登録・ECIES 鍵ペア・ブロック・既読・送信履歴 | Cloudflare D1 | スキーマは `migrations/0001_init.sql` |

## ローカル開発

```bash
npm ci
cp .dev.vars.example .dev.vars   # 値を埋める（下記）
npm run dev                      # vite dev
# 本番に近い確認は: npm run build && npm run preview（wrangler pages dev）
npm run check                    # svelte-kit sync && svelte-check（型チェック）
```

D1 スキーマの適用:

```bash
wrangler d1 execute mado --local  --file migrations/0001_init.sql
wrangler d1 execute mado --remote --file migrations/0001_init.sql
```

### 環境変数（`.dev.vars` / 本番は wrangler secrets）

| 変数 | 用途 |
|---|---|
| `OAUTH_PRIVATE_KEYS` | OAuth DPoP 署名用 ES256 JWK の配列（JSON）。生成: `npx @atproto/oauth-client-node generate-key ES256` |
| `APP_URL` | アプリのベース URL。本番 `https://mado.blue`、ローカル `http://localhost:8788` |
| `CRON_SECRET` | `/api/cron/check-sessions` を保護する Bearer トークン |

KV / D1 のバインディング（`OAUTH_STATE`, `OAUTH_SESSION`, `MADO_SESSION`, `RATE_LIMIT`, `DB`）は `wrangler.toml` で定義。

## cron

`cron-worker/` が別 Worker として定期的に `/api/cron/check-sessions` を叩き、失効した OAuth セッションを KV から掃除する（`CRON_SECRET` 未設定時はエンドポイントが 503 で閉じる）。

## Lexicon

`blue.mado.*` のスキーマは `lexicons/blue/mado/` に JSON で定義（`box` / `koe` / `answer`）。TypeScript の型は `src/types/index.ts`。
