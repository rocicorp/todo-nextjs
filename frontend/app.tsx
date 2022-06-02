import { nanoid } from "nanoid";
import React from "react";
import { Replicache } from "replicache";
import { useSubscribe } from "replicache-react";
import Header from "./header";
import MainSection from "./main-section";
import { M } from "./mutators";
import { listTodos, Todo, TodoUpdate } from "./todo";

const App = ({ rep }: { rep: Replicache<M> }) => {
  const todos = useSubscribe(rep, listTodos, []);

  const handleNewItem = (text: string) =>
    rep.mutate.createTodo({
      id: nanoid(),
      text,
      sort: todos.length > 0 ? todos[todos.length - 1].sort + 1 : 0,
      completed: false,
    });

  const handleUpdateTodo = (update: TodoUpdate) =>
    rep.mutate.updateTodo(update);

  const handleDeleteTodos = (ids: string[]) => {
    for (const id of ids) {
      rep.mutate.deleteTodo(id);
    }
  };

  const handleCompleteTodos = ({
    completed,
    ids,
  }: {
    completed: boolean;
    ids: string[];
  }) => {
    for (const id of ids) {
      rep.mutate.updateTodo({ id, completed });
    }
  };

  return (
    <div>
      <Header onNewItem={handleNewItem} />
      <MainSection
        todos={todos}
        onUpdateTodo={handleUpdateTodo}
        onDeleteTodos={handleDeleteTodos}
        onCompleteTodos={handleCompleteTodos}
      />
    </div>
  );
};

export default App;
