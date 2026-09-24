import { json } from '@sveltejs/kit'

/** Unknown API paths answer in the API's own error shape instead of an HTML page. */
export const fallback = () =>
  json({ error: { code: 'NOT_FOUND', message: 'No such endpoint.' } }, { status: 404 })
