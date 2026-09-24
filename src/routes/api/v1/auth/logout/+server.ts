import { getDb } from '$lib/server/db'
import { clearSessionCookie, endpoint } from '$lib/server/api'
import { logout } from '$lib/server/services/auth'

/** Ends the caller's session (the token stops working) → 204. Safe to call when signed out. */
export const POST = endpoint((event) => {
  if (event.locals.token) logout(getDb(), event.locals.token)
  clearSessionCookie(event.cookies)
  return new Response(null, { status: 204 })
})
