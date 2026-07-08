-- Per-device OAuth session registry.
-- Apply (local):  wrangler d1 execute mado --local  --file migrations/0002_device_sessions.sql
--
-- Background: the atproto OAuth session KV used to be keyed by DID alone, so all
-- of a user's devices shared (and clobbered) one token set and a logout on any
-- device took down every device. The OAuth-session KV key is now namespaced as
-- `${device_key}:${did}`, where device_key is the per-login app-session id.
-- This table is the registry that lets cron scan sessions and lets a box's
-- questions/send pick any live device of the owner to write with.

CREATE TABLE IF NOT EXISTS device_sessions (
  device_key TEXT PRIMARY KEY,   -- per-login id, also the OAuth-session KV namespace
  did        TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  last_seen  INTEGER
);
CREATE INDEX IF NOT EXISTS idx_device_sessions_did ON device_sessions (did);
