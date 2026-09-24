import { error } from '@sveltejs/kit'
import { getDb, resetDb } from '$lib/server/db'

/**
 * Test hook: wipes every table and re-creates the seed account → 204.
 * Only exists when the server runs with TEST_HOOKS=1; otherwise a plain 404.
 */
export const POST = () => {
  if (process.env.TEST_HOOKS !== '1') error(404, 'Not found')
  resetDb(getDb())
  return new Response(null, { status: 204 })
}
