-- Mado D1 schema
-- Apply: wrangler d1 execute mado --local --file migrations/0001_init.sql
--        wrangler d1 execute mado --remote --file migrations/0001_init.sql

-- Users registered with Mado (for cron session checks)
CREATE TABLE IF NOT EXISTS users (
  did        TEXT PRIMARY KEY,
  added_at   INTEGER NOT NULL
);

-- ECIES keypairs per question box
CREATE TABLE IF NOT EXISTS keypairs (
  owner_did   TEXT    NOT NULL,
  box_rkey    TEXT    NOT NULL,
  private_hex TEXT    NOT NULL,
  created_at  INTEGER NOT NULL,
  PRIMARY KEY (owner_did, box_rkey)
);

-- Block list: owner blocks target
CREATE TABLE IF NOT EXISTS blocks (
  owner_did   TEXT    NOT NULL,
  target_did  TEXT    NOT NULL,
  blocked_at  INTEGER NOT NULL,
  PRIMARY KEY (owner_did, target_did)
);

-- Read state for received questions
CREATE TABLE IF NOT EXISTS reads (
  owner_did TEXT    NOT NULL,
  rkey      TEXT    NOT NULL,
  read_at   INTEGER NOT NULL,
  PRIMARY KEY (owner_did, rkey)
);

-- Sent question history (newest-first, capped per sender in application logic)
CREATE TABLE IF NOT EXISTS sent (
  sender_did TEXT    NOT NULL,
  owner_did  TEXT    NOT NULL,
  koe_rkey   TEXT    NOT NULL,
  sent_at    INTEGER NOT NULL,
  body       TEXT    NOT NULL,
  PRIMARY KEY (sender_did, owner_did, koe_rkey)
);
CREATE INDEX IF NOT EXISTS idx_sent_sender_time ON sent (sender_did, sent_at DESC);

-- Read state for sent questions (which sent items has the sender opened)
CREATE TABLE IF NOT EXISTS sent_reads (
  sender_did TEXT    NOT NULL,
  token      TEXT    NOT NULL,
  read_at    INTEGER NOT NULL,
  PRIMARY KEY (sender_did, token)
);
