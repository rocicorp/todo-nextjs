import React, { useState } from "react";
import classnames from "classnames";
import { Todo, TodoUpdate } from "./todo";
import TodoTextInput from "./todo-text-input";

export function TodoItem({
  todo,
  onUpdate,
  onDelete,
}: {
  todo: Todo;
  onUpdate: (changes: TodoUpdate) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);

  const handleDoubleClick = () => {
    setEditing(true);
  };

  const handleSave = (text: string) => {
    if (text.length === 0) {
      onDelete();
    } else {
      onUpdate({ text });
    }
    setEditing(false);
  };

  const handleToggleComplete = () => onUpdate({ completed: !todo.completed });

  const handleToggleUrgent = () => onUpdate({ urgent: !todo.urgent });

  let element;
  if (editing) {
    element = (
      <TodoTextInput
        initial={todo.text}
        onSubmit={handleSave}
        onBlur={handleSave}
      />
    );
  } else {
    element = (
      <div className="view">
        <input
          className="toggle"
          type="checkbox"
          checked={todo.completed}
          onChange={handleToggleComplete}
        />
        <label onDoubleClick={handleDoubleClick}>{todo.text}</label>
        <button className="toggle-urgent" onClick={handleToggleUrgent} />
        <button className="destroy" onClick={() => onDelete()} />
      </div>
    );
  }

  return (
    <li
      className={classnames({
        completed: todo.completed,
        urgent: todo.urgent,
        editing,
      })}
    >
      {element}
    </li>
  );
}
