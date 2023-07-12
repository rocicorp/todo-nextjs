import type { JSONValue } from "replicache";
import { z } from "zod";
import type { Executor } from "./pg";

export async function getEntry(
  executor: Executor,
  key: string
): Promise<JSONValue | undefined> {
  const row = await executor.one(
    "select value from entry where key = $1 and deleted = false",
    [key]
  );
  if (!row) {
    return undefined;
  }
  return JSON.parse(row.value);
}

export async function putEntry(
  executor: Executor,
  key: string,
  value: JSONValue,
  version: number
): Promise<void> {
  await executor.none(
    `
    insert into entry (key, value, deleted, version, lastmodified)
    values ($1, $2, false, $3, now())
      on conflict (key) do update set
        value = $2, deleted = false, version = $3, lastmodified = now()
    `,
    [key, JSON.stringify(value), version]
  );
}

export async function delEntry(
  executor: Executor,
  key: string,
  version: number
): Promise<void> {
  await executor.none(
    `update entry set deleted = true, version = $2 where key = $1`,
    [key, version]
  );
}

export async function* getEntries(
  executor: Executor,
  fromKey: string
): AsyncIterable<readonly [string, JSONValue]> {
  const rows = await executor.manyOrNone(
    `select key, value from entry where key >= $1 and deleted = false order by key`,
    [fromKey]
  );
  for (const row of rows) {
    yield [row.key as string, JSON.parse(row.value) as JSONValue] as const;
  }
}

export async function getChangedEntries(
  executor: Executor,
  prevVersion: number
): Promise<[key: string, value: JSONValue, deleted: boolean][]> {
  const rows = await executor.manyOrNone(
    `select key, value, deleted from entry where version > $1`,
    [prevVersion]
  );
  return rows.map((row) => [row.key, JSON.parse(row.value), row.deleted]);
}

export async function getCookie(executor: Executor): Promise<number> {
  const row = await executor.one(
    `select value from meta where key = 'globalVersion'`
  );
  const { value } = row;
  return z.number().parse(value);
}

export async function setCookie(
  executor: Executor,
  version: number
): Promise<void> {
  await executor.none(
    `update meta set value = '$1' where key = 'globalVersion'`,
    [version]
  );
}

export async function getLastMutationID(
  executor: Executor,
  clientID: string
): Promise<number | undefined> {
  const row = await executor.oneOrNone(
    `select lastmutationid from client where id = $1`,
    [clientID]
  );
  const value = row?.lastmutationid;
  if (value === undefined) {
    return undefined;
  }
  return z.number().parse(value);
}

export async function setLastMutationID(
  executor: Executor,
  clientID: string,
  lastMutationID: number
): Promise<void> {
  await executor.none(
    `
    insert into client (id, lastmutationid, lastmodified)
    values ($1, $2, now())
      on conflict (id) do update set lastmutationid = $2, lastmodified = now()
    `,
    [clientID, lastMutationID]
  );
}
