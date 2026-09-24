import { json } from '@sveltejs/kit'
import { getDb } from '$lib/server/db'
import { endpoint, readBody, requireUser } from '$lib/server/api'
import { addTodo, listTodos } from '$lib/server/services/todos'

/** `{ todos }`, oldest first. */
export const GET = endpoint((event) => {
  const user = requireUser(event)
  return json({ todos: listTodos(getDb(), user.id) })
})

/** Body `{ title }` → 201 with the todo; 403 TODO_LIMIT_REACHED at the plan limit. */
export const POST = endpoint(async (event) => {
  const user = requireUser(event)
  const { title } = await readBody(event)
  return json(addTodo(getDb(), user.id, title), { status: 201 })
})
