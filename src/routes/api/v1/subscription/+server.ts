import { json } from '@sveltejs/kit'
import { getDb } from '$lib/server/db'
import { endpoint, readBody, requireUser } from '$lib/server/api'
import { account, cancel, subscribe } from '$lib/server/services/subscription'

/** The caller's plan and usage. */
export const GET = endpoint((event) => {
  const user = requireUser(event)
  return json(account(getDb(), user.id))
})

/**
 * Body `{ todoLimit: 5 | 8 | 10, acceptedTerms: true }` → 201 with the new account.
 * 400 TERMS_NOT_ACCEPTED / INVALID_PLAN, 409 PLAN_ALREADY_ACTIVE.
 */
export const POST = endpoint(async (event) => {
  const user = requireUser(event)
  const body = await readBody(event)
  return json(subscribe(getDb(), user.id, body), { status: 201 })
})

/** Cancel → the account, back on Free. 404 NO_SUBSCRIPTION, 409 CANCEL_BLOCKED. */
export const DELETE = endpoint((event) => {
  const user = requireUser(event)
  return json(cancel(getDb(), user.id))
})
