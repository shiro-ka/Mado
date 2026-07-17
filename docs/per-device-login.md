# 設計メモ: 端末ごとの独立ログイン（メインPC班向けハンドオフ）

> ステータス: **✅ 実装済み（commit `cc7af16` 「端末ごとの独立ログインを実装」）**。
> 以下は設計時のメモ。実装の実態は `src/lib/oauth.server.ts`（`createOAuthClient` の
> `deviceKey` 名前空間化 / `restoreAnyOAuthSession`）・`api/auth/callback`（`addDeviceSession`）・
> `api/auth/logout`（端末別 revoke）・`api/cron/check-sessions`（device_sessions 走査）を参照。
> migration `0002_device_sessions` は本番適用済み。**実機テスト（2端末ログイン）は未消化**。

## いま何が問題か

現状「1ユーザー = 1 OAuthセッション」になっている。

- アプリセッション（`MADO_SESSION`, KV, ランダム32文字の `sessionId` キー）は **すでに端末ごと**。
- atproto OAuthセッション（`OAUTH_SESSION`, KV）は **DID（sub）単位** で1つだけ。
  `@atproto/oauth-client-node` は `sessionStore.get(sub)` / `set(sub, ...)` を **DIDで** 呼ぶ設計
  （`src/lib/oauth.server.ts` の `sessionStore` ラッパ参照）。

結果、端末Bでログインすると同じDIDのOAuthセッションを共有・上書きし、どこか1端末で
ログアウト（`client.revoke(did)` + `sessionStore.del(did)`）すると **全端末が巻き込まれる**。
（塊B B4 で「OAuthセッションが消えたらアプリセッションも掃除」を入れたので、いまは
ログアウトが実質グローバルになっている。独立ログインを入れるならこの前提を作り直す。）

## 推奨アプローチ: OAuthセッションストアを端末単位で名前空間化する

atproto クライアントは `sub`（DID）でストアを引くので、**ストアのキーに端末IDを混ぜる**ラッパを
かませば、クライアント本体を触らずに端末ごとの独立トークンセットを持てる。

1. **端末ID**: ログイン確定時（`api/auth/callback`）にアプリセッションの `sessionId` を採番済み。
   これをそのまま端末キーに使う（= `deviceKey`）。`MADO_SESSION` の値に `deviceKey` を持たせる
   か、`sessionId` 自体を使う。
2. **`createOAuthClient(env, store, deviceKey)`** に `deviceKey` を渡し、`sessionStore` ラッパの
   キーを `` `${deviceKey}:${did}` `` にする（`stateStore` は従来どおりでOK — 一時的な認可フロー用）。
   これで `client.restore(did)` は現在の端末のセッションだけを見る。
3. **全呼び出し箇所に deviceKey を通す**:
   - `restoreOAuthSession(env, store, did)` → `restoreOAuthSession(env, store, did, deviceKey)`
   - 呼び出し元: `api/boxes/create`, `api/questions/send`（← ここは **箱オーナーの** セッションを
     復元している点に注意。送信者の端末ではなくオーナー側の任意端末のセッションが要る）,
     `api/answers/create`, `api/cron/check-sessions`。
   - `getSession` / `hasOAuthSession` の存在チェック（B4）も端末キー付きに変える。
4. **`api/questions/send` の注意**: 質問書き込みはオーナーのOAuthセッションで行う。オーナーが
   複数端末を持つ場合、「どの端末のセッションで書くか」を選ぶ必要がある。案: オーナーの
   `deviceKey` 一覧から生きているものを1つ選ぶ（`OAUTH_SESSION` の `list` prefix 検索）。
   → **これがサーバー間書き込みを端末非依存にするための肝**。ここだけは「DIDに紐づく任意の
   有効セッション」を引く別ヘルパ（`restoreAnyOAuthSession(did)`）が要る。
5. **cron の作り直し（重要）**: `check-sessions` は `listUsers()`（DID一覧）で回している。
   端末単位セッションだと **KVの `OAUTH_SESSION` を prefix 走査**して端末セッション単位で
   検査・掃除する形に変える。D1に「deviceKey → did」レジストリ（下記）を持たせて回す方が堅い。

## スキーマ / ストレージの追加

- D1 に端末セッションのレジストリを追加すると cron と一覧が楽:
  ```sql
  CREATE TABLE device_sessions (
    device_key TEXT PRIMARY KEY,   -- = MADO_SESSION の sessionId
    did        TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    last_seen  INTEGER
  );
  CREATE INDEX idx_device_sessions_did ON device_sessions(did);
  ```
  → `migrations/0002_device_sessions.sql` を追加し、`wrangler d1 execute mado --local/--remote` で適用。
- `OAUTH_SESSION` のキーを `` `${deviceKey}:${did}` `` に変更（既存の平キー分は移行 or 期限切れ扱い）。

## 影響範囲チェックリスト

- [x] `src/lib/oauth.server.ts`: `createOAuthClient` / `restoreOAuthSession` / `checkOAuthSession` /
      `revokeOAuthSession` に deviceKey を追加。`restoreAnyOAuthSession(did)`（オーナー書き込み用）を追加。
- [x] `src/lib/auth.server.ts`: `getSession` の OAuthセッション存在チェックを deviceKey 付きに（レガシーセッションのフォールバックあり）。
- [x] `src/routes/api/auth/callback`: ログイン時に device_sessions へ登録、deviceKey で OAuth セッション保存。
- [x] `src/routes/api/auth/logout`: **その端末だけ** revoke + del（全端末を消さない）。
- [x] `api/boxes/create`, `api/answers/create`: 呼び出し側 deviceKey（送信者=自分の端末）。
- [x] `api/questions/send`: オーナー側は `restoreAnyOAuthSession(ownerDid)`。
- [x] `api/cron/check-sessions`: device_sessions ベースの走査に変更。
- [ ] 「全端末からログアウト」UIオプション（did 単位で全 deviceKey を revoke）。→ **任意・未着手**（残りはこれだけ）。

## テスト観点（実機必須）

- 2端末で同一アカウントに個別ログイン → 片方ログアウトでもう片方が生存すること。
- 各端末で独立にトークンリフレッシュが走ること（B5の requestLock は deviceKey 単位のロック名に）。
- cron 実行後に有効な端末セッションが消えないこと。
- オーナーが全端末ログアウト状態のとき、その箱への送信が 503 で正しく閉じること。

## 参考

- 現状の OAuth まわり: `src/lib/oauth.server.ts`
- セッション: `src/lib/auth.server.ts`, `src/lib/store.ts`
- cron: `src/routes/api/cron/check-sessions/+server.ts`, `cron-worker/src/index.ts`
