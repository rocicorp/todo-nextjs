// Low-level config and utilities for Postgres.

import pgInit, { ITask } from "pg-promise";
import { getConnectionString } from "../supabase";

const pgp = pgInit();
export const db = pgp(getConnectionString());

export type Executor = ITask<unknown>;

const { isolationLevel, TransactionMode } = pgp.txMode;

// Helper to make sure we always access database at serializable level.
export async function tx<R>(f: (executor: Executor) => R) {
  return await db.tx(
    { mode: new TransactionMode({ tiLevel: isolationLevel.serializable }) },
    f
  );
}
