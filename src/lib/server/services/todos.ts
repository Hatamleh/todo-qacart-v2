import type { Db } from '../db'
import { AppError } from '../errors'
import { countTodos, todoLimit } from './subscription'

export interface Todo {
  id: number
  title: string
  completed: boolean
  createdAt: string
}

interface TodoRow {
  id: number
  title: string
  completed: number
  created_at: string
}

const toTodo = (r: TodoRow): Todo => ({
  id: r.id,
  title: r.title,
  completed: r.completed === 1,
  createdAt: r.created_at,
})

function cleanTitle(title: unknown): string {
  const clean = typeof title === 'string' ? title.trim() : ''
  if (!clean) throw new AppError(400, 'EMPTY_TITLE', 'Todo title cannot be empty.')
  return clean
}

/** Oldest first — the order the Flutter list shows them in. */
export function listTodos(db: Db, userId: number): Todo[] {
  const rows = db.prepare('SELECT * FROM todos WHERE user_id = ? ORDER BY id').all(userId) as TodoRow[]
  return rows.map(toTodo)
}

/** Someone else's todo answers exactly like a missing one, so ids cannot be probed. */
export function getTodo(db: Db, userId: number, id: number): Todo {
  const row = db.prepare('SELECT * FROM todos WHERE id = ? AND user_id = ?').get(id, userId) as
    | TodoRow
    | undefined
  if (!row) throw new AppError(404, 'TODO_NOT_FOUND', 'Todo not found.')
  return toTodo(row)
}

export function addTodo(db: Db, userId: number, title: unknown): Todo {
  const clean = cleanTitle(title)

  // Count + insert in one transaction so two parallel requests cannot both
  // squeeze past the limit.
  return db.transaction(() => {
    const limit = todoLimit(db, userId)
    if (countTodos(db, userId) >= limit) {
      throw new AppError(
        403,
        'TODO_LIMIT_REACHED',
        `You have reached your limit of ${limit} todos. Upgrade your plan to add more.`,
      )
    }
    const { lastInsertRowid } = db
      .prepare('INSERT INTO todos (user_id, title) VALUES (?, ?)')
      .run(userId, clean)
    return getTodo(db, userId, Number(lastInsertRowid))
  }).immediate()
}

export function updateTodo(
  db: Db,
  userId: number,
  id: number,
  patch: { title?: unknown; completed?: unknown },
): Todo {
  const todo = getTodo(db, userId, id)
  const title = patch.title === undefined ? todo.title : cleanTitle(patch.title)
  if (patch.completed !== undefined && typeof patch.completed !== 'boolean') {
    throw new AppError(400, 'INVALID_COMPLETED', '"completed" must be true or false.')
  }
  const completed = patch.completed ?? todo.completed

  db.prepare('UPDATE todos SET title = ?, completed = ? WHERE id = ?').run(title, completed ? 1 : 0, id)
  return getTodo(db, userId, id)
}

export function deleteTodo(db: Db, userId: number, id: number): Todo {
  const todo = getTodo(db, userId, id)
  db.prepare('DELETE FROM todos WHERE id = ?').run(id)
  return todo
}
