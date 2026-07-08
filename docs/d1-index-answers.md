# 設計メモ: 回答/質問のD1インデックス化（メインPC班に判断を委ねる）

> ステータス: **提案 / 未実装**。やるかどうかの判断込みでメインPC班へパス。
> 塊C(C5)で「無言破棄→警告ログ＋上限1000→3000」の応急処置は入れ済み。これはその恒久対策。

## 背景（何が問題か）

回答・質問・箱の一覧は PDS のリポジトリを **全走査** している（`src/lib/atproto.ts` の
`listAllRecords` → `listBoxes` / `listQuestions` / `getAnswersByOwner` / `listAnswers`）。

- `listAnswers(ownerDid, koeUri)` は **1質問の詳細ページを開くたびに** オーナーの
  `blue.mado.answer` レコードを全部取得してメモリでフィルタする（N+1 / O(全回答数)）。
- `listRecords` は 100件/ページ。`hardCap` に達すると停止するので、**回答/質問が上限を
  超えると古いものが読めなくなる**（応急処置で3000に引き上げ＋警告ログ済み）。

ライトユーザーには無害だが、活発なオーナー（数千件規模）で表示が重くなる／欠ける。

## いつやるべきか（判断材料）

- 現状 3000 件で頭打ち。1オーナーの累計回答/質問がここに近づくユーザーが出たら着手。
- `[listAllRecords] hardCap ... reached` の警告ログが本番で出始めたら黄信号。
- それまでは応急処置で十分。**先回りで作るかは費用対効果でメインPC班が判断**。

## 推奨アプローチ: D1に回答/質問のインデックスを持つ

PDS を正本のまま、D1 を **参照引き用のインデックス**として二重化する。

```sql
-- migrations/0002_content_index.sql（案）
CREATE TABLE answers_index (
  owner_did   TEXT NOT NULL,
  answer_rkey TEXT NOT NULL,
  koe_uri     TEXT NOT NULL,   -- 参照先の質問(koe)のAT-URI
  created_at  INTEGER NOT NULL,
  PRIMARY KEY (owner_did, answer_rkey)
);
CREATE INDEX idx_answers_by_koe ON answers_index(owner_did, koe_uri, created_at);

-- 質問一覧も重いなら同様に
CREATE TABLE questions_index (
  owner_did  TEXT NOT NULL,
  koe_rkey   TEXT NOT NULL,
  box_uri    TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (owner_did, koe_rkey)
);
CREATE INDEX idx_questions_by_owner ON questions_index(owner_did, created_at);
```

書き込み経路でインデックスも更新する:

- `writeAnswer`（`api/answers/create`）成功時に `answers_index` へ INSERT。
- `writeQuestion`（`api/questions/send`）成功時に `questions_index` へ INSERT。
- 削除（`DeleteQuestionButton` → `api/questions/[rkey]` DELETE、回答削除があれば）で該当行を DELETE。

読み取りを差し替える:

- `listAnswers(ownerDid, koeUri)` → `answers_index` を `koe_uri` で引き、rkey だけ取り、
  必要なら本文は `getRecord` でまとめ取り（or 本文もインデックスに載せてPDS往復を無くす）。
- 受信トレイの回答有無バッジ（`getAnswersByOwner`）→ `answers_index` を owner で集計。

## 移行（既存データ）

- 既存の PDS 上レコードは D1 に無い。**バックフィル**が必要:
  - 一度きりの管理スクリプト、または cron で `listAllRecords` を回して `INSERT OR IGNORE`。
  - 応急処置の全走査コードは、インデックスが埋まるまでのフォールバックとして残しておくと安全
    （インデックスに無ければ PDS 走査、という二段構え）。

## 注意点

- PDS が正本なので、D1 インデックスは **ズレる前提**で設計（欠損時は PDS フォールバック、
  重複は PRIMARY KEY で吸収）。厳密同期を狙わない。
- 本文までD1に載せると PDS 往復ゼロで速いが、D1 容量と「PDSが正本」の原則との兼ね合いで判断。

## 参考

- 全走査の実装: `src/lib/atproto.ts`（`listAllRecords` ほか）
- 書き込み: `src/routes/api/answers/create`, `src/routes/api/questions/send`
- D1 スキーマ: `migrations/0001_init.sql`、ストア: `src/lib/store.ts`
