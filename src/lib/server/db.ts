import Database from 'better-sqlite3'
import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { hashPassword } from './password'
import { SEED_ACCOUNT } from '$lib/rules'

export type Db = Database.Database

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    email         TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token      TEXT PRIMARY KEY,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
  );

  CREATE TABLE IF NOT EXISTS subscriptions (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    todo_limit     INTEGER NOT NULL,
    status         TEXT NOT NULL CHECK (status IN ('active', 'cancelled')),
    accepted_terms INTEGER NOT NULL CHECK (accepted_terms = 1),
    started_at     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    cancelled_at   TEXT
  );

  -- At most ONE active subscription per user. This makes "cancel before you
  -- switch plans" a hard database rule, not only something checked in code.
  CREATE UNIQUE INDEX IF NOT EXISTS one_active_sub_per_user
    ON subscriptions(user_id) WHERE status = 'active';

  CREATE TABLE IF NOT EXISTS todos (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title      TEXT NOT NULL,
    completed  INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
  );

  CREATE INDEX IF NOT EXISTS todos_by_user ON todos(user_id, id);
`

/**
 * Opens (or creates) a database and makes sure the schema and the seed account
 * exist. Pass ":memory:" for a throwaway database — that is what unit tests do.
 */
export function createDb(path: string): Db {
  if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true })

  const db = new Database(path)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  db.exec(SCHEMA)
  seed(db)
  return db
}

/**
 * Creates the seed account when it is missing. Like the Flutter app it is only
 * created — never logged in, never given todos.
 */
export function seed(db: Db) {
  db.prepare('INSERT OR IGNORE INTO users (email, password_hash) VALUES (?, ?)').run(
    SEED_ACCOUNT.email,
    hashPassword(SEED_ACCOUNT.password),
  )
}

/** Wipes every row and re-seeds. Backs the `POST /api/v1/test/reset` hook. */
export function resetDb(db: Db) {
  db.transaction(() => {
    db.exec('DELETE FROM todos; DELETE FROM subscriptions; DELETE FROM sessions; DELETE FROM users;')
    db.exec("DELETE FROM sqlite_sequence WHERE name IN ('users', 'todos', 'subscriptions')")
    seed(db)
  })()
}

let instance: Db | null = null

/** The app-wide database, opened on first use from `DATABASE_PATH`. */
export function getDb(): Db {
  instance ??= createDb(process.env.DATABASE_PATH || 'data/todo.db')
  return instance
}
