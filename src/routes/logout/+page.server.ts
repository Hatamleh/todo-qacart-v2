import { redirect } from '@sveltejs/kit'
import { getDb } from '$lib/server/db'
import { clearSessionCookie } from '$lib/server/api'
import { logout } from '$lib/server/services/auth'
import type { PageServerLoad } from './$types'

/** /logout → ends the session and lands on the login page. */
export const load: PageServerLoad = ({ locals, cookies }) => {
  if (locals.token) logout(getDb(), locals.token)
  clearSessionCookie(cookies)
  redirect(303, '/login')
}
