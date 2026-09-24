import { randomBytes } from 'node:crypto'
import type { Db } from '../db'
import { AppError } from '../errors'
import { hashPassword, verifyPassword } from '../password'
import { EMAIL_MIN_LENGTH, PASSWORD_MIN_LENGTH } from '$lib/rules'

export interface PublicUser {
  id: number
  email: string
  createdAt: string
}

interface UserRow {
  id: number
  email: string
  password_hash: string
  created_at: string
}

const toPublic = (u: UserRow): PublicUser => ({ id: u.id, email: u.email, createdAt: u.created_at })

function normalizeEmail(email: unknown): string {
  return typeof email === 'string' ? email.trim().toLowerCase() : ''
}

function newSession(db: Db, userId: number): string {
  const token = randomBytes(32).toString('hex')
  db.prepare('INSERT INTO sessions (token, user_id) VALUES (?, ?)').run(token, userId)
  return token
}

/** Creates the account and signs it in (returns a session token), like Flutter's `register()`. */
export function register(db: Db, email: unknown, password: unknown) {
  const normalized = normalizeEmail(email)
  if (!normalized.includes('@') || normalized.length < EMAIL_MIN_LENGTH) {
    throw new AppError(400, 'INVALID_EMAIL', 'Please enter a valid email address.')
  }
  if (typeof password !== 'string' || password.length < PASSWORD_MIN_LENGTH) {
    throw new AppError(
      400,
      'INVALID_PASSWORD',
      `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`,
    )
  }
  if (db.prepare('SELECT 1 FROM users WHERE email = ?').get(normalized)) {
    throw new AppError(409, 'EMAIL_TAKEN', 'An account with that email already exists.')
  }

  const { lastInsertRowid } = db
    .prepare('INSERT INTO users (email, password_hash) VALUES (?, ?)')
    .run(normalized, hashPassword(password))
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(lastInsertRowid) as UserRow
  return { user: toPublic(user), token: newSession(db, user.id) }
}

export function login(db: Db, email: unknown, password: unknown) {
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(normalizeEmail(email)) as
    | UserRow
    | undefined
  if (!user) throw new AppError(401, 'USER_NOT_FOUND', 'No account found for that email.')
  if (typeof password !== 'string' || !verifyPassword(password, user.password_hash)) {
    throw new AppError(401, 'WRONG_PASSWORD', 'Incorrect password.')
  }
  return { user: toPublic(user), token: newSession(db, user.id) }
}

/** Ends this one session. Other devices stay signed in. */
export function logout(db: Db, token: string) {
  db.prepare('DELETE FROM sessions WHERE token = ?').run(token)
}

export function userForToken(db: Db, token: string): PublicUser | null {
  const user = db
    .prepare('SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = ?')
    .get(token) as UserRow | undefined
  return user ? toPublic(user) : null
}
