// Low-level config and utilities for Postgres.

import { Pool, QueryResult } from "pg";
import { createDatabase } from "./schema";
import { getSupabaseServerConfig } from "./supabase";

async function getPool() {
  const global = globalThis as unknown as {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    _pool: Pool;
  };
  if (!global._pool) {
    global._pool = await initPool();
  }
  return global._pool;
}

async function initPool() {
  console.log("creating global pool");

  const config = getSupabaseServerConfig();

  // The Supabase URL env var is the URL to access the Supabase REST API,
  // which looks like: https://pfdhjzsdkvlmuyvttfvt.supabase.co.
  // We need to convert it into the Postgres connection string.
  const { url, dbpass } = config;
  const host = new URL(url).hostname;
  const id = host.split(".")[0];
  const connectionString = `postgresql://postgres:${encodeURIComponent(
    dbpass
  )}@db.${id}.supabase.co:5432/postgres`;

  const pool = new Pool({
    connectionString,
  });

  // Replicache requires serializable transactions.
  pool.on("connect", async (client) => {
    void client.query(
      "SET SESSION CHARACTERISTICS AS TRANSACTION ISOLATION LEVEL SERIALIZABLE"
    );
  });

  await withExecutorAndPool(async (executor) => {
    await transactWithExecutor(executor, async (executor) => {
      await createDatabase(executor);
    });
  }, pool);

  return pool;
}

export async function withExecutor<R>(f: (executor: Executor) => R) {
  const p = await getPool();
  return withExecutorAndPool(f, p);
}

async function withExecutorAndPool<R>(
  f: (executor: Executor) => R,
  p: Pool
): Promise<R> {
  const client = await p.connect();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const executor = async (sql: string, params?: any[]) => {
    try {
      return await client.query(sql, params);
    } catch (e) {
      throw new Error(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        `Error executing SQL: ${sql}: ${(e as unknown as any).toString()}`
      );
    }
  };

  try {
    return await f(executor);
  } finally {
    client.release();
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Executor = (sql: string, params?: any[]) => Promise<QueryResult>;
export type TransactionBodyFn<R> = (executor: Executor) => Promise<R>;

/**
 * Invokes a supplied function within a transaction.
 * @param body Function to invoke. If this throws, the transaction will be rolled
 * back. The thrown error will be re-thrown.
 */
export async function transact<R>(body: TransactionBodyFn<R>) {
  return await withExecutor(async (executor) => {
    return await transactWithExecutor(executor, body);
  });
}

async function transactWithExecutor<R>(
  executor: Executor,
  body: TransactionBodyFn<R>
) {
  await executor("begin");
  try {
    const r = await body(executor);
    await executor("commit");
    return r;
  } catch (e) {
    console.log("caught error", e, "rolling back");
    await executor("rollback");
    throw e;
  }
}
