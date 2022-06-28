import { nanoid } from "nanoid";
import React from "react";
import { Replicache } from "replicache";
import { useSubscribe } from "replicache-react";
import Header from "./components/header";
import MainSection from "./components/main-section";
import { M } from "./mutators";
import { listTodos, TodoUpdate } from "./todo";

// Top-level component for our app.
const App = ({ rep }: { rep: Replicache<M> }) => {
  // Subscribe to all todos and sort them.
  const todos = useSubscribe(rep, listTodos, [], [rep]);
  todos.sort((a, b) => a.sort - b.sort);

  // Define basic event handlers and connect them to Replicache mutators. Each
  // of these mutators runs immediately (optimistically) locally, then runs
  // again on the server-side automatically.
  const handleNewItem = (text: string) =>
    rep.mutate.createTodo({
      id: nanoid(),
      text,
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
