CREATE TABLE IF NOT EXISTS oauth_locks (
  key        TEXT    PRIMARY KEY,
  token      TEXT    NOT NULL,
  expires_at INTEGER NOT NULL
);
