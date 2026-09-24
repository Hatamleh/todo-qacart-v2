import { json } from '@sveltejs/kit'
import { getDb } from '$lib/server/db'
import { endpoint, requireUser } from '$lib/server/api'
import { account } from '$lib/server/services/subscription'

/** The signed-in user plus their plan and usage. */
export const GET = endpoint((event) => {
  const user = requireUser(event)
  return json({ user, account: account(getDb(), user.id) })
})
