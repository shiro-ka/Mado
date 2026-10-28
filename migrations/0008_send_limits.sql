CREATE TABLE IF NOT EXISTS send_limits (
  key        TEXT    PRIMARY KEY,
  count      INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_send_limits_expires ON send_limits (expires_at);
