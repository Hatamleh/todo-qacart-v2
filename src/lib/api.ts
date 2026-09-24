/**
 * The UI's only way to the data: plain fetch against /api/v1. The pages never
 * touch the database, so everything a user can do is something an API test
 * can do too.
 */
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message)
  }
}

type Fetch = typeof fetch

export async function api<T = unknown>(
  path: string,
  init: { method?: string; body?: unknown } = {},
  fetchFn: Fetch = fetch,
): Promise<T> {
  const res = await fetchFn(`/api/v1${path}`, {
    method: init.method ?? 'GET',
    headers: init.body === undefined ? undefined : { 'content-type': 'application/json' },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  })
  if (res.status === 204) return undefined as T
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new ApiError(res.status, data.error?.code ?? 'ERROR', data.error?.message ?? 'Something went wrong.')
  }
  return data as T
}

export interface Todo {
  id: number
  title: string
  completed: boolean
  createdAt: string
}

export interface Account {
  plan: string
  subscription: { todoLimit: number; planName: string; startedAt: string } | null
  todoLimit: number
  used: number
  remaining: number
  canCancel: boolean
  todosToDeleteBeforeCancel: number
}
