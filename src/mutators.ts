// This file defines our "mutators".
//
// Replicache mutators are how you change data in Replicache apps, and are the
// key enabling idea that makes Replicache work.
//
// Mutators at core are just named functions with a special signature:
//
// type Mutator<Args, Ret> = (tx: WriteTransaction, args: Args) => Promise<Ret>;
//
// For example:
// async function createTodo(tx: WriteTransaction, args: { text: string }) ...
// is a mutator.
//
// Mutators are registered with Replicache at construction-time and callable
// like `myReplicache.mutate.createTodo({text: "foo"})`.
//
// Replicache runs each mutation immediately (optimistically) on the client,
// against the local cache, and then later (usually moments later) *re-runs* it
// on the server-side against the backend datastore during sync.
//
// This re-running of mutations is how Replicache handles conflicts: the
// mutators themselves defensively check the database when they run and do the
// appropriate thing. The Replicache sync protocol ensures that the server-side
// result takes precedence over the client-side optimistic result.
//
// In JavaScript-based Replicache apps, it's common to reuse mutator functions
// on both client and server. This sample demonstrates the pattern by using
// these mutators both with Replicache on the client (see app.tsx) and
// on the server (see /pages/api/replicache/[op].ts).
//
// See https://doc.replicache.dev/how-it-works#sync-details for all the detail
// on how Replicache syncs and resolves conflicts, but understanding that is not
// required to get up and running.
import { WriteTransaction } from "replicache";
import { Todo, putTodo, updateTodo, deleteTodo, listTodos } from "./todo";

export type M = typeof mutators;

// We define three mutators.
//
// updateTodo and deleteTodo are just re-exported CRUD functions generated in
// todo.ts.
//
// However, it's also possible to define specialized mutators that have more
// interesting conflict-resolution logic. See `createTodo` below for an example
// of that.
export const mutators = {
  updateTodo,
  deleteTodo,
  createTodo,
};

// This specialized mutator creates a new todo, assigning the next available
// sort value. By implementing this in a mutator, we solve the problem of two
// clients simultaneously choosing the same sort value.
//
// If two clients create new todos concurrently, they both might choose the same
// sort value locally (optimistically). That's fine because later when the
// mutator re-runs on the server the two todos will get unique values.
//
// Replicache will automatically sync the change back to the clients, reconcile
// any changes that happened client-side in the meantime, and update the UI to
// reflect the changes.
export async function createTodo(
  tx: WriteTransaction,
  todo: Omit<Todo, "sort">
) {
  const todos = await listTodos(tx);
  todos.sort((t1, t2) => t1.sort - t2.sort);

  const maxSort = todos.pop()?.sort ?? 0;
  await putTodo(tx, { ...todo, sort: maxSort + 1 });
}
