import type { Handle } from '@sveltejs/kit'
import { getDb } from '$lib/server/db'
import { SESSION_COOKIE } from '$lib/server/api'
import { userForToken } from '$lib/server/services/auth'

/**
 * Resolves the caller from `Authorization: Bearer <token>` (API clients) or the
 * session cookie (the browser). The header wins when both are sent.
 */
export const handle: Handle = async ({ event, resolve }) => {
  const header = event.request.headers.get('authorization')
  const bearer = header?.match(/^Bearer\s+(.+)$/i)?.[1] ?? null
  const token = bearer ?? event.cookies.get(SESSION_COOKIE) ?? null

  event.locals.token = token
  event.locals.user = token ? userForToken(getDb(), token) : null

  return resolve(event)
}
