import { getDb } from '$lib/server/db'
import { loginFirst, withMessage } from '$lib/server/deep-links'
import { AppError } from '$lib/server/errors'
import { addTodo } from '$lib/server/services/todos'
import type { PageServerLoad } from './$types'

/** /add?title=… → adds a todo, with the same plan limit as the button. */
export const load: PageServerLoad = ({ locals, url }) => {
  if (!locals.user) loginFirst(url, 'Log in first to add a todo.')

  const title = url.searchParams.get('title')
  if (!title?.trim()) withMessage('/todos', 'That link is missing a ?title= value.')

  try {
    addTodo(getDb(), locals.user.id, title)
  } catch (e) {
    if (e instanceof AppError) withMessage('/todos', e.message)
    throw e
  }
  withMessage('/todos', `Added "${title.trim()}".`)
}
