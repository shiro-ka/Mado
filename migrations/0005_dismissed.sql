-- "Dismissed" (スルー) state for received questions.
-- Apply (local):  wrangler d1 execute mado --local  --file migrations/0005_dismissed.sql
-- Apply (remote): wrangler d1 execute mado --remote --file migrations/0005_dismissed.sql
--
-- Background: the inbox (/receive) is organised by "have I dealt with this koe?"
-- rather than "have I opened it?". A koe is:
--   - 回答済み  → an answer record exists (derived from atproto, no row here)
--   - スルー    → deliberately skipped without replying (a row in this table)
--   - 未返信    → neither of the above (the actionable ToDo list)
-- Dismissing removes a koe from the 未返信 list; it still shows under すべて.

CREATE TABLE IF NOT EXISTS dismissed (
  owner_did    TEXT    NOT NULL,
  rkey         TEXT    NOT NULL,
  dismissed_at INTEGER NOT NULL,
  PRIMARY KEY (owner_did, rkey)
);
