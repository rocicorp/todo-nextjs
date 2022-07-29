// This file defines our "Todo" entity.
// You will generally have one such file for each entity in your application.

import { z } from "zod";
import { entitySchema, generate, Update } from "@rocicorp/rails";

// We define our datatypes using https://zod.dev/. This isn't required to use
// Replicache, but is recommended. It gets you free parsing/validation of JSON
// into strong TypeScript types and is also used below to generate helper CRUD
// functions.
export const todoSchema = entitySchema.extend({
  text: z.string(),
  completed: z.boolean(),
  sort: z.number(),
});

// Export generated TypeScript types for use in app.

// The complete Todo type as defined by `todoSchema` above.
export type Todo = z.infer<typeof todoSchema>;

// A version of the Todo type where every field except `id` is optional. Used
// by the generated `updateTodo` function above.
export type TodoUpdate = Update<Todo>;

// We define basic typesafe CRUD helpers for reading and writing Todos to
// Replicache using https://github.com/rocicorp/rails. Again, this is not
// required (you can read and write directly using e.g., Replicache's lower-level
// put() and get() APIs), but this gets you typesafety and validation.
export const {
  put: putTodo,
  update: updateTodo,
  delete: deleteTodo,
  list: listTodos,
} = generate("todo", todoSchema);
