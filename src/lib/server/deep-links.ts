import { redirect } from '@sveltejs/kit'

/**
 * The web version of Flutter's `qacarttodo://…` links. Each route is a plain
 * URL a test can open to jump straight to a state. Every one goes through the
 * same services as the API, so a link can never do something the UI would refuse.
 *
 * Results come back as `?msg=` on the page they redirect to, which shows it as a toast.
 */
export function withMessage(path: string, msg: string): never {
  redirect(303, `${path}${path.includes('?') ? '&' : '?'}msg=${encodeURIComponent(msg)}`)
}

/** Signed out → login, then straight back to the same link (Flutter's "pending link"). */
export function loginFirst(url: URL, msg: string): never {
  withMessage(`/login?next=${encodeURIComponent(url.pathname + url.search)}`, msg)
}
