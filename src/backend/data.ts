import type { JSONValue } from "replicache";
import type { Executor } from "./pg";

export type ClientGroup = {
  id: string;
  userID: string;
};

export type Client = {
  id: string;
  clientGroupID: string;
  lastMutationID: number;
  lastModifiedVersion: number;
};

export async function getClientGroup(executor: Executor, id: string) {
  const row = await executor.oneOrNone(
    "select * from replicache_client_group where id = $1",
    [id]
  );
  if (!row) {
    return null;
  }
  const cg: ClientGroup = {
    id: row.id,
    userID: row.user_id,
  };
  return cg;
}

export async function createClientGroup(
  executor: Executor,
  id: string,
  userID: string
) {
  await executor.none(
    `insert into replicache_client_group (id, user_id) values ($1, $2)`,
    [id, userID]
  );
  return { id, userID };
}

export async function getClient(
  executor: Executor,
  id: string
): Promise<Client | null> {
  const row = await executor.oneOrNone(
    `select * from replicache_client where id = $1`,
    [id]
  );
  if (!row) {
    return null;
  }
  const client: Client = {
    id: row.id,
    clientGroupID: row.client_group_id,
    lastMutationID: row.last_mutation_id,
    lastModifiedVersion: row.last_modified_version,
  };
  return client;
}

export async function createClient(
  executor: Executor,
  id: string,
  clientGroupID: string,
  version: number
): Promise<Client> {
  await executor.none(
    `insert into replicache_client (
      id, client_group_id, last_mutation_id, last_modified_version
    ) values (
      $1, $2, 0, $3
    )`,
    [id, clientGroupID, version]
  );
  return {
    id,
    clientGroupID,
    lastMutationID: 0,
    lastModifiedVersion: version,
  };
}

export async function updateClient(executor: Executor, client: Client) {
  await executor.none(
    `update replicache_client set
      last_mutation_id = $1, last_modified_version = $2 where id = $3`,
    [client.lastMutationID, client.lastModifiedVersion, client.id]
  );
}

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
    insert into entry (key, value, deleted, last_modified_version)
    values ($1, $2, false, $3)
      on conflict (key) do update set
        value = $2, deleted = false, last_modified_version = $3
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
    `update entry set deleted = true, last_modified_version = $2
      where key = $1`,
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
    `select key, value, deleted from entry where last_modified_version > $1`,
    [prevVersion]
  );
  return rows.map((row) => [row.key, JSON.parse(row.value), row.deleted]);
}

export async function getGlobalVersion(executor: Executor): Promise<number> {
  const row = await executor.one(`select version from replicache_space`);
  const { version } = row;
  return version;
}

export async function setGlobalVersion(
  executor: Executor,
  version: number
): Promise<void> {
  await executor.none(`update replicache_space set version = $1`, [version]);
}

export async function getChangedLastMutationIDs(
  executor: Executor,
  clientGroupID: string,
  sinceVersion: number
): Promise<Record<string, number>> {
  console.log("getting changed lmids", [clientGroupID, sinceVersion]);
  const rows = await executor.manyOrNone(
    `select id, last_mutation_id from replicache_client
      where client_group_id = $1 and last_modified_version > $2`,
    [clientGroupID, sinceVersion]
  );
  const result: Record<string, number> = {};
  for (const r of rows) {
    result[r.id] = r.last_mutation_id;
  }
  return result;
}

export async function setLastMutationID(
  executor: Executor,
  clientID: string,
  lastMutationID: number,
  lastModifiedVersion: number
): Promise<void> {
  await executor.none(
    `
    insert into replicache_client (id, last_mutation_id, last_modified_version)
    values ($1, $2, $3)
      on conflict (id) do update set
        lastmutationid = $2, last_modified_version = $3
    `,
    [clientID, lastMutationID, lastModifiedVersion]
  );
}
