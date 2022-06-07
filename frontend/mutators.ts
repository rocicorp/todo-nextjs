import { putTodo, updateTodo, deleteTodos, markTodosCompleted } from "./todo";

export type M = typeof mutators;

export const mutators = {
  putTodo,
  updateTodo,
  deleteTodos,
  markTodosCompleted,
};
