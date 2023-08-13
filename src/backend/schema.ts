import { Executor } from "./pg";

export async function createDatabase(t: Executor) {
  if (await schemaExists(t)) {
    return;
  }
  console.log("creating database");
  await createSchemaVersion1(t);
}

export async function createSchemaVersion1(t: Executor) {
  await t.none(`create table replicache_space (
    id text primary key not null,
    version integer not null)`);
  await t.none(
    `insert into replicache_space (id, version) values ('global', 0)`
  );

  await t.none(`create table replicache_client_group (
    id text primary key not null,
    user_id text not null)`);

  await t.none(`create table replicache_client (
    id text primary key not null,
    client_group_id text not null references replicache_client_group(id),
    last_mutation_id integer not null,
    last_modified_version integer not null)`);
  await t.none(
    `create index on replicache_client (client_group_id, last_modified_version)`
  );

  await t.none(`create table entry (
    key text not null,
    value text not null,
    deleted boolean not null,
    last_modified_version integer not null)`);

  await t.none(`create unique index on entry (key)`);
  await t.none(`create index on entry (deleted)`);
  await t.none(`create index on entry (last_modified_version)`);

  // We are going to be using the supabase realtime api from the client to
  // receive pokes. This requires js access to db. We use RLS to restrict this
  // access to only what is needed: read access to the space table. All this
  // gives JS is the version of the space which is harmless. Everything else is
  // auth'd through cookie auth using normal web application patterns.
  await t.none(`alter table replicache_space enable row level security`);
  await t.none(`alter table replicache_client_group enable row level security`);
  await t.none(`alter table replicache_client enable row level security`);
  await t.none(`alter table replicache_client enable row level security`);
  await t.none(`create policy anon_read_replicache_space on replicache_space
      for select to anon using (true)`);

  // Here we enable the supabase realtime api and monitor updates to the
  // replicache_space table.
  await t.none(`alter publication supabase_realtime
    add table replicache_space`);
  await t.none(`alter publication supabase_realtime set
    (publish = 'update');`);
}

async function schemaExists(t: Executor): Promise<number> {
  const spaceExists = await t.one(`select exists(
      select from pg_tables where schemaname = 'public'
      and tablename = 'replicache_space')`);
  return spaceExists.exists;
}
