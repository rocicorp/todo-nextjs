import React from "react";
import { Todo, TodoUpdate } from "./todo";
import { TodoItem } from "./todo-item";

const TodoList = ({
  todos,
  onUpdateTodo,
  onDeleteTodo,
}: {
  todos: Todo[];
  onUpdateTodo: (id: string, changes: TodoUpdate) => void;
  onDeleteTodo: (id: string) => void;
}) => {
  return (
    <ul className="todo-list">
      {todos.map((todo) => (
        <TodoItem
          todo={todo}
          key={todo.id}
          onUpdate={(changes) => onUpdateTodo(todo.id, changes)}
          onDelete={() => onDeleteTodo(todo.id)}
        />
      ))}
    </ul>
  );
};

export default TodoList;
