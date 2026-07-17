# DM通知 リリース手順（メインPC班向け引き継ぎ）

opt-in の公式DM通知機能。**コード・UIは実装済み・main にマージ済み**。残るは Cloudflare 本番への反映のみ（Cloudflare認証が必要なため、wrangler がログイン済みの端末で実施すること）。

## ステータス

- ✅ 機能・UI 実装済み（`/settings/notifications`、`/receive` 導線、送信時ファンアウト）
- ✅ `npm run check`（型）・`npm run build`（本番ビルド）通過
- ✅ ローカルでDM着弾を検証済み（`scripts/verify-dm.mjs` で `@mado.blue` → 実アカウントに疎通OK）
- ⬜ 本番D1マイグレーション未適用
- ⬜ 本番Secret未投入

## やること

### 0. Cloudflare 認証（未ログインの端末なら）

```
npx wrangler login          # ブラウザでOAuth。または CLOUDFLARE_API_TOKEN を設定
```

### 1. 本番D1にマイグレーション0004を適用

```
npx wrangler d1 execute mado --remote --file migrations/0004_notification_prefs.sql
```

`notification_prefs (did, dm_enabled, updated_at)` を作成する。

### 2. 本番Secretを投入

先に Bluesky で公式アカ（@mado.blue）の **「DMアクセス」を有効にした App Password** を用意しておくこと。

```
npx wrangler pages secret put MADO_OFFICIAL_IDENTIFIER   # 公式アカの handle か did（bot login用）  例: mado.blue
npx wrangler pages secret put MADO_OFFICIAL_APP_PASSWORD # DMアクセス有効の App Password
npx wrangler pages secret put MADO_OFFICIAL_HANDLE       # UI表示・フォロー導線用の handle          例: mado.blue
# 任意: 公式アカが bsky.social 以外の PDS の場合のみ
npx wrangler pages secret put MADO_OFFICIAL_PDS          # 例: https://example.com
```

> ローカル検証で使った値は `.dev.vars`（gitignore済・非コミット）に入っている。本番はそれと同じ値を上記で投入する。

## 反映後の確認

1. `/settings/notifications` を開く
   - `MADO_OFFICIAL_HANDLE` 未設定だと「準備中」表示になる（＝Secret未投入のサイン）
   - 未フォロー → トグルがゲート（無効）＋フォローボタン
   - フォロー → トグル有効化 → ON にできる
2. 別アカから窓に声を送る → オーナー（通知ON＆公式フォロー済み）の Bluesky DM に着弾するか

## 安全性メモ

- Secret 未投入でも本番は壊れない：`getOfficialAccount` が null を返し、通知は静かにスキップ。受信トレイ（`/receive`）は従来どおり全件表示。
- フォローしていない相手 / DM閉じの相手への送信は `sendMessage` が例外→ swallow。声は `/receive` に残る。

## 再検証ツール

`scripts/verify-dm.mjs` — ブラウザ/OAuth不要でDM着弾だけ確認するスタンドアロン。`.dev.vars` から creds を読む。

```
node scripts/verify-dm.mjs <送信先handle-or-did>
```

- フォロー済み相手 → `SENT ✓`
- 未フォロー相手 → 拒否（ゲート挙動の確認になる）
