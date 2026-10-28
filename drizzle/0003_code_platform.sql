CREATE TABLE IF NOT EXISTS code_projects(id TEXT PRIMARY KEY,owner TEXT NOT NULL,repository TEXT NOT NULL DEFAULT '',listed INTEGER NOT NULL DEFAULT 0,revision INTEGER NOT NULL,updated_at INTEGER NOT NULL,snapshot TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS code_projects_owner ON code_projects(owner,updated_at);
CREATE INDEX IF NOT EXISTS code_projects_repository ON code_projects(repository);
CREATE TABLE IF NOT EXISTS code_releases(id TEXT PRIMARY KEY,project TEXT NOT NULL,created_at INTEGER NOT NULL,snapshot TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS code_releases_project ON code_releases(project,created_at);
CREATE TABLE IF NOT EXISTS code_rooms(id TEXT PRIMARY KEY,project TEXT NOT NULL,release TEXT NOT NULL,revision INTEGER NOT NULL,snapshot TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS code_deliveries(id TEXT PRIMARY KEY,created_at INTEGER NOT NULL);
