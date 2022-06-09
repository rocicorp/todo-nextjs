import { Knex } from "knex";
import { JSONValue } from "replicache";
import { z } from "zod";

export async function createDatabase(knex: Knex) {
  const schemaVersion = await getSchemaVersion(knex);
  if (schemaVersion < 0 || schemaVersion > 1) {
    throw new Error("Unexpected schema version: " + schemaVersion);
  }
  if (schemaVersion === 0) {
    await createSchemaVersion1(knex);
  }
  console.log("schemaVersion is 1 - nothing to do");
}

const metaRow = z.object({
  key: z.string(),
  value: z.string(),
});
type MetaRow = z.infer<typeof metaRow>;

async function getSchemaVersion(knex: Knex) {
  const metaExists = await knex.schema.hasTable("meta");
  if (!metaExists) {
    return 0;
  }

  const res = await knex.first().from("meta").where({ key: "schemaVersion" });
  if (!res) {
    return 0;
  }

  return JSON.parse(metaRow.parse(res).value);
}

export const spaceRow = z.object({
  id: z.string(),
  version: z.number(),
  lastmodified: z.date(),
});
export type SpaceRow = z.infer<typeof spaceRow>;

const clientRow = z.object({
  id: z.string(),
  lastmutationid: z.number(),
  lastmodified: z.date(),
});
type ClientRow = z.infer<typeof clientRow>;

export async function createSchemaVersion1(knex: Knex) {
  await knex.schema
    .createTable("meta", (table) => {
      table.text("key").primary().notNullable();
      table.text("value").notNullable();
    })
    .createTable("space", (table) => {
      table.text("id").primary().notNullable();
      table.integer("version").notNullable();
      table.timestamp("lastmodified").notNullable().defaultTo(knex.fn.now());
    })
    .createTable("client", (table) => {
      table.text("id").primary().notNullable();
      table.integer("lastmutationid").notNullable();
      table.timestamp("lastmodified").notNullable().defaultTo(knex.fn.now());
    })
    .createTable("entry", (table) => {
      table.text("spaceid").notNullable();
      table.text("key").notNullable();
      table.text("value").notNullable();
      table.boolean("deleted").notNullable();
      table.integer("version").notNullable();
      table.timestamp("lastmodified").notNullable().defaultTo(knex.fn.now());
      table.unique(["spaceid", "key"]);
      table.index("spaceid");
      table.index("deleted");
      table.index("version");
    });

  await knex("meta").insert<MetaRow>({ key: "schemaVersion", value: "1" });
}

export const entryRow = z.object({
  spaceid: z.string(),
  key: z.string(),
  value: z.string(),
  deleted: z.boolean(),
  version: z.number(),
  lastmodified: z.date(),
});
export type EntryRow = z.infer<typeof entryRow>;

export async function getEntry(
  knex: Knex,
  spaceid: string,
  key: string
): Promise<JSONValue | undefined> {
  const val = await knex("entry")
    .first()
    .where({ spaceid, key, deleted: false });
  if (val === undefined) {
    return val;
  }
  const entry = entryRow.parse(val);
  return JSON.parse(entry.value);
}

export async function putEntry(
  knex: Knex,
  spaceID: string,
  key: string,
  value: JSONValue,
  version: number
): Promise<void> {
  await knex("entry")
    .insert<EntryRow>({
      spaceid: spaceID,
      key,
      value: JSON.stringify(value),
      deleted: false,
      version,
    })
    .onConflict(["spaceid", "key"])
    .merge();
}

export async function delEntry(
  knex: Knex,
  spaceID: string,
  key: string,
  version: number
): Promise<void> {
  await knex("entry")
    .update<EntryRow>({
      deleted: true,
      version,
    })
    .where({ spaceid: spaceID, key });
}

export async function* getEntries(
  knex: Knex,
  spaceID: string,
  fromKey: string
): AsyncIterable<readonly [string, JSONValue]> {
  // TODO: Is there a lazy iterator in knex?
  const rows = await knex("entry")
    .where({ spaceid: spaceID })
    .andWhere("key", ">=", fromKey)
    .orderBy("key");
  for (const row of rows) {
    const entry = entryRow.parse(row);
    yield [row.key as string, JSON.parse(entry.value) as JSONValue] as const;
  }
}

export async function getChangedEntries(
  knex: Knex,
  spaceID: string,
  prevVersion: number
): Promise<[key: string, value: JSONValue, deleted: boolean][]> {
  const rows = await knex("entry")
    .where({ spaceid: spaceID })
    .andWhere("version", ">", prevVersion);
  return rows.map((row) => {
    const entry = entryRow.parse(row);
    return [entry.key, JSON.parse(entry.value), entry.deleted];
  });
}

export async function getCookie(
  knex: Knex,
  spaceID: string
): Promise<number | undefined> {
  const res = await knex("space").first("version").where({ id: spaceID });
  return spaceRow.pick({ version: true }).parse(res).version;
}

export async function setCookie(
  knex: Knex,
  spaceID: string,
  version: number
): Promise<void> {
  await knex<SpaceRow>("space")
    .insert({ id: spaceID, version })
    .onConflict("id")
    .merge();
}

export async function getLastMutationID(
  knex: Knex,
  clientID: string
): Promise<number | undefined> {
  const res = await knex<ClientRow>("client")
    .first("lastmutationid")
    .where({ id: clientID });
  return clientRow.pick({ lastmutationid: true }).parse(res).lastmutationid;
}

export async function setLastMutationID(
  knex: Knex,
  clientID: string,
  lastMutationID: number
): Promise<void> {
  await knex<ClientRow>("client")
    .insert({ id: clientID, lastmutationid: lastMutationID })
    .onConflict("id")
    .merge();
}
