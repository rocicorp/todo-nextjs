// Low-level config and utilities for Postgres.

import pgInit, { IDatabase, ITask } from "pg-promise";
import { getConnectionString } from "../supabase";
import { createDatabase } from "./schema";

const pgp = pgInit();

export type Executor = ITask<unknown>;

const { isolationLevel, TransactionMode } = pgp.txMode;

const dbp = (async () => {
  const db = await pgp(getConnectionString());
  await tx(createDatabase, db);
  return db;
})();

// Helper to make sure we always access database at serializable level.
export async function tx<R>(
  f: (executor: Executor) => R,
  db?: IDatabase<unknown> | undefined
) {
  if (!db) {
    db = await dbp;
  }
  return await db.tx(
    { mode: new TransactionMode({ tiLevel: isolationLevel.serializable }) },
    f
  );
}
