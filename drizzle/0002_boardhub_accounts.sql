CREATE TABLE IF NOT EXISTS boardhub_accounts (
 id TEXT PRIMARY KEY NOT NULL,
 google_sub TEXT UNIQUE NOT NULL,
 email TEXT NOT NULL,
 name TEXT NOT NULL,
 avatar TEXT NOT NULL DEFAULT '',
 created_at INTEGER NOT NULL,
 updated_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS boardhub_sessions (
 token_hash TEXT PRIMARY KEY NOT NULL,
 account_id TEXT NOT NULL REFERENCES boardhub_accounts(id) ON DELETE CASCADE,
 expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS boardhub_session_expiry ON boardhub_sessions(expires_at);
CREATE TABLE IF NOT EXISTS boardhub_oauth (
 state_hash TEXT PRIMARY KEY NOT NULL,
 verifier TEXT NOT NULL,
 nonce TEXT NOT NULL,
 guest_owner TEXT NOT NULL,
 next_path TEXT NOT NULL,
 expires_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS boardhub_favorites (
 owner TEXT NOT NULL,
 game_id TEXT NOT NULL,
 created_at INTEGER NOT NULL,
 PRIMARY KEY(owner,game_id)
);
