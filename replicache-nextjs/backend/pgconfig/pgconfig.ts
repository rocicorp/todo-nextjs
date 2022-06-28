import { Pool } from "pg";
import { Executor } from "../pg";
import { getSupabaseServerConfig } from "../supabase";
import { PGMemConfig } from "./pgmem";
import { PostgresDBConfig } from "./postgres";
import { supabaseDBConfig } from "./supabase";

/**
 * We use Postgres in a few different ways: directly, via supabase,
 * emulated with pg-mem. This interface abstracts their differences.
 */
export interface PGConfig {
  initPool(): Pool;
  getSchemaVersion(executor: Executor): Promise<number>;
}

export function getDBConfig(): PGConfig {
  const dbURL = process.env.DATABASE_URL;
  if (dbURL) {
    return new PostgresDBConfig(dbURL);
  }
  const supabaseServerConfig = getSupabaseServerConfig();
  if (supabaseServerConfig) {
    return supabaseDBConfig(supabaseServerConfig);
  }
  return new PGMemConfig();
}
