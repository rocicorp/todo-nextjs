import type { JSONValue } from "replicache";
import type { Storage } from "replicache-transaction";
import { putEntry, getEntry, getEntries, delEntry } from "./data";
import type { Executor } from "./pg";

// Implements the Storage interface required by replicache-transaction in terms
// of our Postgres database.
export class PostgresStorage implements Storage {
  private _version: number;
  private _executor: Executor;

  constructor(version: number, executor: Executor) {
    this._version = version;
    this._executor = executor;
  }

  putEntry(key: string, value: JSONValue): Promise<void> {
    return putEntry(this._executor, key, value, this._version);
  }

  async hasEntry(key: string): Promise<boolean> {
    const v = await this.getEntry(key);
    return v !== undefined;
  }

  getEntry(key: string): Promise<JSONValue | undefined> {
    return getEntry(this._executor, key);
  }

  getEntries(fromKey: string): AsyncIterable<readonly [string, JSONValue]> {
    return getEntries(this._executor, fromKey);
  }

  delEntry(key: string): Promise<void> {
    return delEntry(this._executor, key, this._version);
  }
}
