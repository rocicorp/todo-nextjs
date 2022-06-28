// This file defines our "Todo" entity and its operations.
//
// Much of this is generated using @rocicorp/rails, a helper library which can
// generate a CRUD API for Replicache given just a type definition. See
// https://github.com/rocicorp/rails for more information.

import { z } from "zod";
import { entitySchema, generate, Update } from "@rocicorp/rails";
import { WriteTransaction } from "replicache";

// Define the todo datatype using the zod schema language.
// See https://zod.dev/ for documentation.
export const todoSchema = entitySchema.extend({
  text: z.string(),
  completed: z.boolean(),
  sort: z.number(),
});

// Generate basic CRUD API for that schema.
const {
  put: putTodo,
  update: updateTodo,
  delete: deleteTodo,
  list: listTodos,
} = generate("todo", todoSchema);

// Export relevant TS types for use in app.
export type Todo = z.infer<typeof todoSchema>;
export type TodoUpdate = Update<Todo>;

// The generated put, update, delete, etc. functions can be used as mutators
// directly because they have the right signature. For simple apps, this is
// often all you need!
//
// But the generated functions also nicely compose into higher-level, more
// specialized mutators. See createTodo for an example below.
export { createTodo, updateTodo, deleteTodo, listTodos };

// This specialized mutator creates a new todo, assigning the next available
// sort value. By implementing this in a mutator, we solve the problem of two
// clients simultaneously choosing the same sort value.
//
// The way this works is that Replicache mutations run at least twice: once on
// the client, optimistically, against the local datastore; and then once again
// on the server against the backend datastore.
//
// If two clients create new todos concurrently, they both might choose the same
// sort value locally. That's fine because later when the mutator re-runs on the
// server the two todos will get unique values. Replicache will automatically
// sync the change back to the clients, reconcile any changes that happened
// client-side in the meantime, and update the UI to reflect the changes.
async function createTodo(tx: WriteTransaction, todo: Omit<Todo, "sort">) {
  const todos = await listTodos(tx);
  todos.sort((t1, t2) => t1.sort - t2.sort);

  const maxSort = todos.pop()?.sort ?? 0;
  await putTodo(tx, { ...todo, sort: maxSort + 1 });
}
