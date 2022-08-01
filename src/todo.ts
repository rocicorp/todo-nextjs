import { ReadTransaction } from "replicache";

export type Todo = {
  id: string;
  text: string;
  completed: boolean;
  sort: number;
};

export type TodoUpdate = Partial<Todo> & Pick<Todo, "id">;

export async function listTodos(tx: ReadTransaction) {
  return (await tx.scan().values().toArray()) as Todo[];
}
