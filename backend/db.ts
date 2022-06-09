// TODO: sqlite
import knex, { Knex } from "knex";

const pg = {
  client: "pg",
  connection: process.env.PG_CONNECTION_STRING,
  asyncStackTraces: true,
  pool: {
    min: 0,
    max: 10,
  },
};
const sqlite = {
  client: "sqlite3",
  connection: {
    filename: "./sqlite.db",
  },
  useNullAsDefault: true,
};
const k = knex(sqlite);

export type TransactionBodyFn<R> = (knex: Knex) => Promise<R>;

export async function withExecutor<R>(body: TransactionBodyFn<R>): Promise<R> {
  return await body(k);
}

/**
 * Invokes a supplied function within an RDS transaction.
 * @param body Function to invoke. If this throws, the transaction will be rolled
 * back. The thrown error will be re-thrown.
 */
export async function transact<R>(body: TransactionBodyFn<R>): Promise<R> {
  for (let i = 0; i < 10; i++) {
    try {
      return await k.transaction(body);
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
  throw new Error("Failed to complete transaction after 10 attempts");
}

//stackoverflow.com/questions/60339223/node-js-transaction-coflicts-in-postgresql-optimistic-concurrency-control-and
function shouldRetryTransaction(err: unknown) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const code = typeof err === "object" ? String((err as any).code) : null;
  return code === "40001" || code === "40P01";
}
