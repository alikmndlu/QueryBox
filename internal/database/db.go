package database

import (
	"database/sql"

	_ "github.com/glebarez/go-sqlite"
)

const schema = `
PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;

CREATE TABLE IF NOT EXISTS collections (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    parent_id TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    FOREIGN KEY(parent_id) REFERENCES collections(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS queries (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    sql_content TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    collection_id TEXT,
    dialect TEXT NOT NULL DEFAULT 'postgresql',
    is_favorite INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    last_used_at DATETIME NOT NULL,
    FOREIGN KEY(collection_id) REFERENCES collections(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS tags (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS query_tags (
    query_id TEXT NOT NULL,
    tag_id TEXT NOT NULL,
    PRIMARY KEY (query_id, tag_id),
    FOREIGN KEY(query_id) REFERENCES queries(id) ON DELETE CASCADE,
    FOREIGN KEY(tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS query_versions (
    id TEXT PRIMARY KEY,
    query_id TEXT NOT NULL,
    sql_content TEXT NOT NULL,
    created_at DATETIME NOT NULL,
    FOREIGN KEY(query_id) REFERENCES queries(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS connection_profiles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    driver TEXT NOT NULL,
    host TEXT NOT NULL DEFAULT '',
    port INTEGER NOT NULL DEFAULT 0,
    database TEXT NOT NULL DEFAULT '',
    username TEXT NOT NULL DEFAULT '',
    password TEXT NOT NULL DEFAULT '',
    ssl_mode TEXT NOT NULL DEFAULT 'disable',
    read_only INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS execution_history (
    id TEXT PRIMARY KEY,
    profile_id TEXT NOT NULL,
    profile_name TEXT NOT NULL,
    sql_content TEXT NOT NULL,
    execution_time_ms INTEGER NOT NULL,
    row_count INTEGER NOT NULL,
    status TEXT NOT NULL,
    error_message TEXT NOT NULL DEFAULT '',
    executed_at DATETIME NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_queries_collection ON queries(collection_id);
CREATE INDEX IF NOT EXISTS idx_queries_favorite ON queries(is_favorite);
CREATE INDEX IF NOT EXISTS idx_queries_updated ON queries(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_query_tags_tag ON query_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_query_versions_query ON query_versions(query_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_execution_history_time ON execution_history(executed_at DESC);
`

// InitDB initializes SQLite database connection and runs schema migrations
func InitDB(dbPath string) (*sql.DB, error) {
	db, err := sql.Open("sqlite", dbPath)
	if err != nil {
		return nil, err
	}

	if err := db.Ping(); err != nil {
		return nil, err
	}

	_, err = db.Exec(schema)
	if err != nil {
		return nil, err
	}

	// Run initial seed data if table is empty
	if err := seedInitialData(db); err != nil {
		// Non-fatal
	}

	return db, nil
}
