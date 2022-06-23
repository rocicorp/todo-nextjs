// Low-level config and utilities for Postgres.

import { Pool, QueryResult } from "pg";
import { newDb } from "pg-mem";
import { createDatabase } from "./schema";

export const memdb = !process.env.DATABASE_URL;

const pool = (async () => {
  const global = (globalThis as unknown) as {
    _pool: Pool;
  };
  console.log("global._pool is", global._pool);
  if (!global._pool) {
    console.log("creating global pool");
    const pool = memdb
      ? (new (newDb().adapters.createPg().Pool)() as Pool)
      : new Pool({
          connectionString: process.env.DATABASE_URL,
          ssl:
            process.env.NODE_ENV === "production"
              ? {
                  rejectUnauthorized: false,
                }
              : undefined,
        });
    await withExecutorAndPool(createDatabase, pool);

    // the pool will emit an error on behalf of any idle clients
    // it contains if a backend error or network partition happens
    pool.on("error", (err) => {
      console.error("Unexpected error on idle client", err);
      process.exit(-1);
    });
    pool.on("connect", async (client) => {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      client.query(
        "SET SESSION CHARACTERISTICS AS TRANSACTION ISOLATION LEVEL SERIALIZABLE"
      );
    });
    global._pool = pool;
  }
  return global._pool;
})();

export async function withExecutor<R>(f: (executor: Executor) => R) {
  const p = await pool;
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
        `Error executing SQL: ${sql}: ${((e as unknown) as any).toString()}`
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
 * Invokes a supplied function within an RDS transaction.
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
  for (let i = 0; i < 10; i++) {
    try {
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
    } catch (e) {
      if (shouldRetryTransaction(e)) {
        console.log(
          `Retrying transaction due to error ${e} - attempt number ${i}`
        );
        continue;
      }
      throw e;
    }
  }
  throw new Error("Tried to execute transacation too many times. Giving up.");
}

//stackoverflow.com/questions/60339223/node-js-transaction-coflicts-in-postgresql-optimistic-concurrency-control-and
function shouldRetryTransaction(err: unknown) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const code = typeof err === "object" ? String((err as any).code) : null;
  return code === "40001" || code === "40P01";
}
