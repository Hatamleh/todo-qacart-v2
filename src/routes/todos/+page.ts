import { redirect } from '@sveltejs/kit'
import { api, ApiError, type Account, type Todo } from '$lib/api'
import type { PageLoad } from './$types'

/** Loads through the public API — the same calls an API test makes. */
export const load: PageLoad = async ({ fetch, url, depends }) => {
  depends('app:todos')
  try {
    const [{ todos }, account] = await Promise.all([
      api<{ todos: Todo[] }>('/todos', {}, fetch),
      api<Account>('/subscription', {}, fetch),
    ])
    return { todos, account }
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) {
      redirect(303, `/login?next=${encodeURIComponent(url.pathname + url.search)}&msg=${encodeURIComponent('Log in to see your todos.')}`)
    }
    throw e
  }
}
