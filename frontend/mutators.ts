import { createTodo, updateTodo, deleteTodo } from "./todo";

export type M = typeof mutators;

export const mutators = {
  createTodo,
  updateTodo,
  deleteTodo,
};
