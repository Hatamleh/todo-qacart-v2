import { json } from '@sveltejs/kit'
import { getDb } from '$lib/server/db'
import { endpoint, readBody, setSessionCookie } from '$lib/server/api'
import { register } from '$lib/server/services/auth'

/** Body `{ email, password }` → 201 `{ user, token }`, signed in. */
export const POST = endpoint(async (event) => {
  const { email, password } = await readBody(event)
  const result = register(getDb(), email, password)
  setSessionCookie(event.cookies, result.token)
  return json(result, { status: 201 })
})
