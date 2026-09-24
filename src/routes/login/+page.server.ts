import { redirect } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = ({ locals, url }) => {
  if (locals.user) redirect(303, safeNext(url.searchParams.get('next')))
}

/** Only same-site paths, so `?next=` can't bounce someone to another site. */
function safeNext(next: string | null) {
  return next?.startsWith('/') && !next.startsWith('//') ? next : '/todos'
}
