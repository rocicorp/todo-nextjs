import { Executor } from "./pg";

export async function createDatabase(t: Executor) {
  const schemaVersion = await getSchemaVersion(t);
  if (schemaVersion < 0 || schemaVersion > 1) {
    throw new Error("Unexpected schema version: " + schemaVersion);
  }
  if (schemaVersion === 0) {
    console.log("creating database");
    await createSchemaVersion1(t);
  } else {
    console.log("database is up to date");
  }
}

export async function createSchemaVersion1(t: Executor) {
  await t.none("create table meta (key text primary key, value json)");
  await t.none("insert into meta (key, value) values ('schemaVersion', '1')");
  await t.none("insert into meta (key, value) values ('globalVersion', '0')");

  await t.none(`create table client (
          id text primary key not null,
          lastmutationid integer not null,
          lastmodified timestamp(6) not null
          )`);

  await t.none(`create table entry (
        key text not null,
        value text not null,
        deleted boolean not null,
        version integer not null,
        lastmodified timestamp(6) not null
        )`);

  await t.none(`create unique index on entry (key)`);
  await t.none(`create index on entry (deleted)`);
  await t.none(`create index on entry (version)`);

  await t.none(`alter publication supabase_realtime add table meta`);
  await t.none(`alter publication supabase_realtime set
      (publish = 'insert, update, delete');`);
}

async function getSchemaVersion(t: Executor): Promise<number> {
  const metaExists = await t.one(`select exists(
      select from pg_tables where schemaname = 'public' and tablename = 'meta')`);
  if (!metaExists.exists) {
    return 0;
  }
  const qr = await t.one(`select value from meta where key = 'schemaVersion'`);
  return qr.value;
}
