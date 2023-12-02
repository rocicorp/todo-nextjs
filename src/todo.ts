// This file defines our Todo domain type in TypeScript, and a related helper
// function to get all Todos. You'd typically have one of these files for each
// domain object in your application.

import { ReadTransaction } from "replicache";

export type Todo = {
  readonly id: string;
  readonly text: string;
  readonly completed: boolean;
  readonly sort: number;
};

export type TodoUpdate = Partial<Todo> & Pick<Todo, "id">;

export async function listTodos(tx: ReadTransaction) {
  return await tx.scan<Todo>().values().toArray();
}
