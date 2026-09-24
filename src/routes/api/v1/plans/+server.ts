import { json } from '@sveltejs/kit'
import { listPlans } from '$lib/server/services/subscription'
import { CANCEL_KEEP_LIMIT, FREE_TODO_LIMIT } from '$lib/rules'

/** Public: the paid plans and the free/cancel limits. */
export const GET = () =>
  json({ freeTodoLimit: FREE_TODO_LIMIT, cancelKeepLimit: CANCEL_KEEP_LIMIT, plans: listPlans() })
