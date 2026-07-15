-- Per-user notification preferences.
-- Apply (local):  wrangler d1 execute mado --local  --file migrations/0004_notification_prefs.sql
-- Apply (remote): wrangler d1 execute mado --remote --file migrations/0004_notification_prefs.sql
--
-- Background: notifications are an opt-in supplement — the receive inbox
-- (/receive) is the source of truth and always has every koe. The only push
-- channel is a DM from the official Mado account, which requires the owner to
-- follow the official account (Bluesky only delivers DMs from followed accounts
-- by default). `dm_enabled = 0` (no row) means opted out; the DM is simply not
-- attempted. A dangling row / disabled account degrades to no-DM at send time.

CREATE TABLE IF NOT EXISTS notification_prefs (
  did        TEXT PRIMARY KEY,
  dm_enabled INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL
);
