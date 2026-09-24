import { json } from '@sveltejs/kit'
import { getDb } from '$lib/server/db'
import { endpoint, readBody, setSessionCookie } from '$lib/server/api'
import { login } from '$lib/server/services/auth'

/** Body `{ email, password }` → 200 `{ user, token }`; 401 on a bad email or password. */
export const POST = endpoint(async (event) => {
  const { email, password } = await readBody(event)
  const result = login(getDb(), email, password)
  setSessionCookie(event.cookies, result.token)
  return json(result)
})
