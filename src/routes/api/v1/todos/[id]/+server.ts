import { json } from '@sveltejs/kit'
import { getDb } from '$lib/server/db'
import { endpoint, parseId, readBody, requireUser } from '$lib/server/api'
import { deleteTodo, getTodo, updateTodo } from '$lib/server/services/todos'

export const GET = endpoint((event) => {
  const user = requireUser(event)
  return json(getTodo(getDb(), user.id, parseId(event.params.id!)))
})

/** Body `{ title?, completed? }` → the updated todo. */
export const PATCH = endpoint(async (event) => {
  const user = requireUser(event)
  const id = parseId(event.params.id!)
  const { title, completed } = await readBody(event)
  return json(updateTodo(getDb(), user.id, id, { title, completed }))
})

/** → the deleted todo. */
export const DELETE = endpoint((event) => {
  const user = requireUser(event)
  return json(deleteTodo(getDb(), user.id, parseId(event.params.id!)))
})
