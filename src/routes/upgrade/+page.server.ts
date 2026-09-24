import { redirect } from '@sveltejs/kit'
import { getDb } from '$lib/server/db'
import { loginFirst, withMessage } from '$lib/server/deep-links'
import { activeSubscription } from '$lib/server/services/subscription'
import type { PageServerLoad } from './$types'

/** /upgrade → the todo list with the upgrade dialog open. */
export const load: PageServerLoad = ({ locals, url }) => {
  if (!locals.user) loginFirst(url, 'Log in first to upgrade.')

  const current = activeSubscription(getDb(), locals.user.id)
  if (current) {
    withMessage('/todos', `You are already on the ${current.planName} plan. Cancel it before choosing another one.`)
  }
  redirect(303, '/todos?sheet=upgrade')
}
