-- Cloudflare D1 schema for Mado (spike).
-- Apply via: wrangler d1 execute mado --file=migrations/0001_init.sql

CREATE TABLE IF NOT EXISTS users (
  did TEXT PRIMARY KEY,
  added_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS keypairs (
  owner_did TEXT NOT NULL,
  box_rkey TEXT NOT NULL,
  private_hex TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (owner_did, box_rkey)
);

CREATE TABLE IF NOT EXISTS reads (
  owner_did TEXT NOT NULL,
  rkey TEXT NOT NULL,
  read_at INTEGER NOT NULL,
  PRIMARY KEY (owner_did, rkey)
);

CREATE TABLE IF NOT EXISTS blocks (
  owner_did TEXT NOT NULL,
  target_did TEXT NOT NULL,
  blocked_at INTEGER NOT NULL,
  PRIMARY KEY (owner_did, target_did)
);

CREATE TABLE IF NOT EXISTS sent (
  sender_did TEXT NOT NULL,
  owner_did TEXT NOT NULL,
  koe_rkey TEXT NOT NULL,
  sent_at INTEGER NOT NULL,
  PRIMARY KEY (sender_did, owner_did, koe_rkey)
);
CREATE INDEX IF NOT EXISTS sent_sender_time ON sent (sender_did, sent_at DESC);

CREATE TABLE IF NOT EXISTS sent_reads (
  sender_did TEXT NOT NULL,
  token TEXT NOT NULL,
  read_at INTEGER NOT NULL,
  PRIMARY KEY (sender_did, token)
);
