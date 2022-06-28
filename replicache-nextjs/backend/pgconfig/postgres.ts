import { Pool } from "pg";
import { Executor } from "../pg";
import { PGConfig } from "./pgconfig";

/**
 * Implements PGConfig over a basic Postgres connection.
 */
export class PostgresDBConfig implements PGConfig {
  private _url: string;

  constructor(url: string) {
    console.log("Creating PostgresDBConfig with url", url);
    this._url = url;
  }

  initPool(): Pool {
    const ssl =
      process.env.NODE_ENV === "production"
        ? {
            rejectUnauthorized: false,
          }
        : undefined;
    return new Pool({
      connectionString: this._url,
      ssl,
    });
  }

  async getSchemaVersion(executor: Executor): Promise<number> {
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
}
