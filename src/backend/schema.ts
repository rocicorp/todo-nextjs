import type { Executor } from "./pg";

export async function createDatabase(executor: Executor) {
  console.log("creating database");
  const schemaVersion = await getSchemaVersion(executor);
  if (schemaVersion < 0 || schemaVersion > 1) {
    throw new Error("Unexpected schema version: " + schemaVersion);
  }
  if (schemaVersion === 0) {
    await createSchemaVersion1(executor);
  }
}

export async function createSchemaVersion1(executor: Executor) {
  await executor("create table meta (key text primary key, value json)");
  await executor("insert into meta (key, value) values ('schemaVersion', '1')");

  await executor(`create table space (
        id text primary key not null,
        version integer not null,
        lastmodified timestamp(6) not null
        )`);

  await executor(`create table client (
          id text primary key not null,
          lastmutationid integer not null,
          lastmodified timestamp(6) not null
          )`);

  await executor(`create table entry (
        spaceid text not null,
        key text not null,
        value text not null,
        deleted boolean not null,
        version integer not null,
        lastmodified timestamp(6) not null
        )`);

  await executor(`create unique index on entry (spaceid, key)`);
  await executor(`create index on entry (spaceid)`);
  await executor(`create index on entry (deleted)`);
  await executor(`create index on entry (version)`);

  await executor(`alter publication supabase_realtime add table space`);
  await executor(`alter publication supabase_realtime set
      (publish = 'insert, update, delete');`);
}

async function getSchemaVersion(executor: Executor): Promise<number> {
  const metaExists = await executor(`select exists(
      select from pg_tables where schemaname = 'public' and tablename = 'meta')`);
  if (!metaExists.rows[0].exists) {
    return 0;
  }
  const qr = await executor(
    `select value from meta where key = 'schemaVersion'`
  );
  return qr.rows[0].value;
}
