// This file exports our mutators. Mutators are just JavaScript functions with
// a special signature that are registered at construction with Replicache and
// callable as `myReplicache.mutate.foo(args)`.
//
// Replicache runs each mutator optimistically on the client-side, and then
// later re-runs it on the server-side against the backend datastore. This
// re-running of mutations is how Replicache handles conflicts: the mutator
// itself can check the datastore when it runs for conflicts and do something
// reasonable.
//
// In JavaScript-based Replicache apps, it's common to reuse mutator functions
// on both client and server. This sample demonstrates the pattern by using
// these mutators both with Replicache on the client (see app.tsx) and
// on the server (see /pages/api/replicache/[op].ts).
import { createTodo, updateTodo, deleteTodo } from "./todo";

export type M = typeof mutators;

export const mutators = {
  createTodo,
  updateTodo,
  deleteTodo,
};
