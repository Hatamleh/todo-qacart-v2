import type { Db } from '../db'
import { AppError } from '../errors'
import { CANCEL_KEEP_LIMIT, FREE_TODO_LIMIT, PLAN_TODO_LIMITS, planName } from '$lib/rules'

export interface Subscription {
  todoLimit: number
  planName: string
  startedAt: string
}

/** Everything the plan card shows. The one place the effective limit is computed. */
export interface Account {
  plan: string
  subscription: Subscription | null
  todoLimit: number
  used: number
  remaining: number
  canCancel: boolean
  todosToDeleteBeforeCancel: number
}

export function listPlans() {
  return PLAN_TODO_LIMITS.map((todoLimit) => ({ todoLimit, name: planName(todoLimit) }))
}

export function activeSubscription(db: Db, userId: number): Subscription | null {
  const row = db
    .prepare(
      "SELECT todo_limit, started_at FROM subscriptions WHERE user_id = ? AND status = 'active'",
    )
    .get(userId) as { todo_limit: number; started_at: string } | undefined
  return row
    ? { todoLimit: row.todo_limit, planName: planName(row.todo_limit), startedAt: row.started_at }
    : null
}

export function todoLimit(db: Db, userId: number): number {
  return activeSubscription(db, userId)?.todoLimit ?? FREE_TODO_LIMIT
}

export function countTodos(db: Db, userId: number): number {
  return (db.prepare('SELECT COUNT(*) AS n FROM todos WHERE user_id = ?').get(userId) as { n: number }).n
}

export function account(db: Db, userId: number): Account {
  const subscription = activeSubscription(db, userId)
  const limit = subscription?.todoLimit ?? FREE_TODO_LIMIT
  const used = countTodos(db, userId)
  return {
    plan: subscription?.planName ?? 'Free',
    subscription,
    todoLimit: limit,
    used,
    remaining: Math.max(0, limit - used),
    canCancel: subscription !== null && used <= CANCEL_KEEP_LIMIT,
    todosToDeleteBeforeCancel: Math.max(0, used - CANCEL_KEEP_LIMIT),
  }
}

export function subscribe(db: Db, userId: number, input: { todoLimit?: unknown; acceptedTerms?: unknown }) {
  if (input.acceptedTerms !== true) {
    throw new AppError(400, 'TERMS_NOT_ACCEPTED', 'You must accept the terms to continue.')
  }
  const limit = input.todoLimit
  if (typeof limit !== 'number' || !(PLAN_TODO_LIMITS as readonly number[]).includes(limit)) {
    throw new AppError(400, 'INVALID_PLAN', 'That plan does not exist.')
  }
  const current = activeSubscription(db, userId)
  if (current) {
    throw new AppError(
      409,
      'PLAN_ALREADY_ACTIVE',
      `You already have the ${current.planName} plan. Cancel it before choosing another one.`,
    )
  }

  db.prepare(
    "INSERT INTO subscriptions (user_id, todo_limit, status, accepted_terms) VALUES (?, ?, 'active', 1)",
  ).run(userId, limit)
  return account(db, userId)
}

/** Blocked until the user is down to CANCEL_KEEP_LIMIT todos — the UI disables the button too. */
export function cancel(db: Db, userId: number) {
  if (!activeSubscription(db, userId)) {
    throw new AppError(404, 'NO_SUBSCRIPTION', 'You do not have a subscription.')
  }
  const extra = countTodos(db, userId) - CANCEL_KEEP_LIMIT
  if (extra > 0) {
    throw new AppError(
      409,
      'CANCEL_BLOCKED',
      `Delete ${extra} more todo(s) first — you can only cancel with ${CANCEL_KEEP_LIMIT} or fewer todos.`,
    )
  }

  db.prepare(
    "UPDATE subscriptions SET status = 'cancelled', cancelled_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE user_id = ? AND status = 'active'",
  ).run(userId)
  return account(db, userId)
}
