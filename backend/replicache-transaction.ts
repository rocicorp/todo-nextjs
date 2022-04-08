import {
  isScanIndexOptions,
  JSONValue,
  makeScanResult,
  ScanNoIndexOptions,
  ScanOptions,
  ScanResult,
  WriteTransaction,
} from "replicache";
import { delEntry, getEntries, getEntry, putEntry } from "./data";
import { Executor } from "./pg";
import { mergePendingChanges } from "./merge-pending";

/**
 * Implements Replicache's WriteTransaction interface in terms of a Postgres
 * transaction.
 */
export class ReplicacheTransaction implements WriteTransaction {
  private _spaceID: string;
  private _clientID: string;
  private _version: number;
  private _executor: Executor;
  private _cache: Map<
    string,
    { value: JSONValue | undefined; dirty: boolean }
  > = new Map();

  constructor(
    executor: Executor,
    spaceID: string,
    clientID: string,
    version: number
  ) {
    this._spaceID = spaceID;
    this._clientID = clientID;
    this._version = version;
    this._executor = executor;
  }

  get clientID(): string {
    return this._clientID;
  }

  async put(key: string, value: JSONValue): Promise<void> {
    this._cache.set(key, { value, dirty: true });
  }
  async del(key: string): Promise<boolean> {
    const had = await this.has(key);
    this._cache.set(key, { value: undefined, dirty: true });
    return had;
  }
  async get(key: string): Promise<JSONValue | undefined> {
    const entry = this._cache.get(key);
    if (entry) {
      return entry.value;
    }
    const value = await getEntry(this._executor, this._spaceID, key);
    this._cache.set(key, { value, dirty: false });
    return value;
  }
  async has(key: string): Promise<boolean> {
    const val = await this.get(key);
    return val !== undefined;
  }

  async isEmpty(): Promise<boolean> {
    for await (const _ of this.scan()) {
      return false;
    }
    return true;
  }

  scan(options: ScanOptions = {} as ScanNoIndexOptions) {
    if (isScanIndexOptions(options)) {
      throw new Error("not implemented");
    }

    const { _executor: executor, _spaceID: spaceID, _cache: cache } = this;

    return makeScanResult(options, async function* (fromKey) {
      const source = getEntries(executor, spaceID, fromKey);

      // TODO: It would be more optimal to keep the _cache in a sorted map in
      // the first place.
      const changes = [...cache]
        .filter(([, { dirty }]) => dirty)
        .filter(([k]) => k.localeCompare(fromKey) >= 0)
        .map(([k, { value }]) => [k, value] as const)
        .sort(([k1], [k2]) => k1.localeCompare(k2));

      for await (const entry of mergePendingChanges(
        source,
        changes[Symbol.iterator]()
      )) {
        yield entry;
      }
    }) as ScanResult<string, JSONValue>;
  }

  async flush(): Promise<void> {
    await Promise.all(
      [...this._cache.entries()]
        .filter(([, { dirty }]) => dirty)
        .map(([k, { value }]) => {
          if (value === undefined) {
            return delEntry(this._executor, this._spaceID, k, this._version);
          } else {
            return putEntry(
              this._executor,
              this._spaceID,
              k,
              value,
              this._version
            );
          }
        })
    );
  }
}
