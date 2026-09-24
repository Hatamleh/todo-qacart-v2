import { redirect } from '@sveltejs/kit'
import { getDb } from '$lib/server/db'
import { clearSessionCookie, setSessionCookie } from '$lib/server/api'
import { withMessage } from '$lib/server/deep-links'
import { AppError } from '$lib/server/errors'
import { logout, register } from '$lib/server/services/auth'
import type { PageServerLoad } from './$types'

/**
 * /register?email=…&password=… → drops any current session and signs up as that
 * user, so a test can set up a fresh account in one hop.
 * Without both params it just opens the sign-up form.
 */
export const load: PageServerLoad = ({ locals, cookies, url }) => {
  const email = url.searchParams.get('email')
  const password = url.searchParams.get('password')
  if (email === null || password === null) redirect(303, '/login?mode=register')

  if (locals.token) logout(getDb(), locals.token)
  clearSessionCookie(cookies)

  try {
    const { token } = register(getDb(), email, password)
    setSessionCookie(cookies, token)
  } catch (e) {
    if (e instanceof AppError) withMessage('/login?mode=register', e.message)
    throw e
  }
  withMessage('/todos', `Registered ${email.trim().toLowerCase()}.`)
}
