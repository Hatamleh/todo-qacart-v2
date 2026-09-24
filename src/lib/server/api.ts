import { json, type Cookies, type RequestEvent } from '@sveltejs/kit'
import { AppError } from './errors'
import type { PublicUser } from './services/auth'

export const SESSION_COOKIE = 'session'

/**
 * Wraps an endpoint so a thrown AppError becomes `{ error: { code, message } }`
 * with the right status. Every endpoint answers in that one error shape.
 */
export function endpoint(fn: (event: RequestEvent) => Promise<Response> | Response) {
  return async (event: RequestEvent) => {
    try {
      return await fn(event)
    } catch (e) {
      if (e instanceof AppError) {
        return json({ error: { code: e.code, message: e.message } }, { status: e.status })
      }
      throw e
    }
  }
}

export function requireUser(event: RequestEvent): PublicUser {
  if (!event.locals.user) throw new AppError(401, 'UNAUTHORIZED', 'You must be logged in.')
  return event.locals.user
}

export async function readBody(event: RequestEvent): Promise<Record<string, unknown>> {
  try {
    const body = await event.request.json()
    if (body && typeof body === 'object' && !Array.isArray(body)) return body
  } catch {
    // fall through
  }
  throw new AppError(400, 'INVALID_JSON', 'The request body must be a JSON object.')
}

/** Anything that is not a positive integer can't be a todo id, so it is a 404 like any other. */
export function parseId(raw: string): number {
  const id = Number(raw)
  if (!Number.isInteger(id) || id < 1) throw new AppError(404, 'TODO_NOT_FOUND', 'Todo not found.')
  return id
}

export function setSessionCookie(cookies: Cookies, token: string) {
  cookies.set(SESSION_COOKIE, token, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production' && process.env.INSECURE_COOKIES !== '1',
    maxAge: 60 * 60 * 24 * 30,
  })
}

export function clearSessionCookie(cookies: Cookies) {
  cookies.delete(SESSION_COOKIE, { path: '/' })
}
