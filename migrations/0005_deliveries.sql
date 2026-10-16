CREATE TABLE IF NOT EXISTS deliveries (
  owner_did      TEXT    NOT NULL,
  koe_rkey       TEXT    NOT NULL,
  sender_did     TEXT,
  sent_at        INTEGER,
  body           TEXT,
  owner_read_at  INTEGER,
  sender_read_at INTEGER,
  PRIMARY KEY (owner_did, koe_rkey)
);
CREATE INDEX IF NOT EXISTS idx_deliveries_sender_time ON deliveries (sender_did, sent_at DESC);

INSERT OR IGNORE INTO deliveries (owner_did, koe_rkey, sender_did, sent_at, body, owner_read_at, sender_read_at)
SELECT s.owner_did, s.koe_rkey, s.sender_did, s.sent_at, s.body, r.read_at, sr.read_at
FROM sent s
LEFT JOIN reads r ON r.owner_did = s.owner_did AND r.rkey = s.koe_rkey
LEFT JOIN sent_reads sr ON sr.sender_did = s.sender_did AND sr.token = s.owner_did || ':' || s.koe_rkey;

INSERT OR IGNORE INTO deliveries (owner_did, koe_rkey, owner_read_at)
SELECT owner_did, rkey, read_at FROM reads;
