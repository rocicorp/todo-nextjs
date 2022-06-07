import { z } from "zod";
import { entitySchema, generate, Update } from "@rocicorp/rails";
import { WriteTransaction } from "replicache";

export const todoSchema = entitySchema.extend({
  text: z.string(),
  completed: z.boolean(),
  sort: z.number(),
});

const {
  put: putTodo,
  update: updateTodo,
  delete: deleteTodo,
  list: listTodos,
} = generate("todo", todoSchema);

export type Todo = z.infer<typeof todoSchema>;
export type TodoUpdate = Update<Todo>;

export { putTodo, updateTodo, listTodos };

export async function deleteTodos(tx: WriteTransaction, ids: string[]) {
  for (const id of ids) {
    await deleteTodo(tx, id);
  }
}

export async function markTodosCompleted(
  tx: WriteTransaction,
  { ids, completed }: { ids: string[]; completed: boolean }
) {
  for (const id of ids) {
    await updateTodo(tx, { id, completed });
  }
}
