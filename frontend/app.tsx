import { nanoid } from "nanoid";
import React from "react";
import { Replicache } from "replicache";
import { useSubscribe } from "replicache-react";
import Header from "./header";
import MainSection from "./main-section";
import { M } from "./mutators";
import { listTodos, TodoUpdate } from "./todo";

const App = ({ rep }: { rep: Replicache<M> }) => {
  const todos = useSubscribe(rep, listTodos, [], [rep]);
  todos.sort((a, b) => a.sort - b.sort);

  const handleNewItem = (text: string) =>
    rep.mutate.putTodo({
      id: nanoid(),
      text,
      sort: todos.length > 0 ? todos[todos.length - 1].sort + 1 : 0,
      completed: false,
    });

  const handleUpdateTodo = (update: TodoUpdate) =>
    rep.mutate.updateTodo(update);

  const handleDeleteTodos = (ids: string[]) => {
    rep.mutate.deleteTodos(ids);
  };

  const handleCompleteTodos = (args: { completed: boolean; ids: string[] }) => {
    rep.mutate.markTodosCompleted(args);
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
