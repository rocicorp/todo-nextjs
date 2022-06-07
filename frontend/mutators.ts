import { putTodo, updateTodo, deleteTodo } from "./todo";

export type M = typeof mutators;

export const mutators = {
  putTodo,
  updateTodo,
  deleteTodo,
};
