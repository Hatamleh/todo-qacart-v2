/**
 * Every business rule of the app in one place — the same numbers as
 * `todo-flutter/lib/rules.dart`. Shared by the server (which enforces them)
 * and the UI (which only uses them to disable buttons early).
 */

/** How many todos a user gets with no active subscription. */
export const FREE_TODO_LIMIT = 3

/** The choices shown in the upgrade dropdown. */
export const PLAN_TODO_LIMITS = [5, 8, 10] as const

/** Before a user is allowed to cancel, they must be down to this many todos. */
export const CANCEL_KEEP_LIMIT = 3

export const PASSWORD_MIN_LENGTH = 6
export const EMAIL_MIN_LENGTH = 5

export function planName(todoLimit: number): string {
  switch (todoLimit) {
    case 5:
      return 'Starter'
    case 8:
      return 'Plus'
    case 10:
      return 'Pro'
    default:
      return 'Custom'
  }
}

/** The account that always exists, so a login test never has to register first. */
export const SEED_ACCOUNT = { email: 'user@qacart.com', password: 'Test@1234' } as const
