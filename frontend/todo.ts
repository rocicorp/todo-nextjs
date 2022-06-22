// This file defines the todo entity and its related operations.
//
// Much of this is generated using @rocicorp/rails, a helper library which can
// generate a CRUD API for Replicache given just a type definition. See
// https://github.com/rocicorp/rails for more information.
import { z } from "zod";
import { entitySchema, generate, Update } from "@rocicorp/rails";
import { WriteTransaction } from "replicache";

// Define the todo datatype.
export const todoSchema = entitySchema.extend({
  text: z.string(),
  completed: z.boolean(),
  sort: z.number(),
});

// Generate basic CRUD API using rails.
const {
  put: putTodo,
  update: updateTodo,
  delete: deleteTodo,
  list: listTodos,
} = generate("todo", todoSchema);

export type Todo = z.infer<typeof todoSchema>;
export type TodoUpdate = Update<Todo>;

// The generated put, update, delete, etc. functions can be used as mutators
// directly because they have the right signature. But they also nicely compose
// into higher-level more specialized mutators like `createTodo`, `deleteTodos`,
// etc below.
export { updateTodo, listTodos, createTodo, deleteTodos, markTodosCompleted };

// This specialized mutator creates a new todo, assigning a sort value that is
// one higher than the current max for this space. It's important to understand
// that this functions runs at least twice: once optimistically on the client,
// and later on the server.
//
// If two clients create new todos concurrently, they both might choose the same
// sort value. That's fine because later when the mutator re-runs on the server
// the two todos will get unique values. Replicache will automaticall sync the
// change back to the clients, reconcile any changes that happened client-side
// in the meantime, and update the UI to reflect the changes.
async function createTodo(tx: WriteTransaction, todo: Omit<Todo, "sort">) {
  const todos = await listTodos(tx);
  todos.sort((t1, t2) => t1.sort - t2.sort);

  const maxSort = todos.pop()?.sort ?? 0;
  await putTodo(tx, { ...todo, sort: maxSort + 1 });
}

async function deleteTodos(tx: WriteTransaction, ids: string[]) {
  for (const id of ids) {
    await deleteTodo(tx, id);
  }
}

async function markTodosCompleted(
  tx: WriteTransaction,
  { ids, completed }: { ids: string[]; completed: boolean }
) {
  for (const id of ids) {
    await updateTodo(tx, { id, completed });
  }
}
