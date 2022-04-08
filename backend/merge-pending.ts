import { JSONValue } from "replicache";

export async function* mergePendingChanges(
  source: AsyncIterator<readonly [string, JSONValue], void, unknown>,
  pending: Iterator<readonly [string, JSONValue | undefined], void>
) {
  for await (const [key, value] of mergePendingChangesWithDeletes(
    source,
    pending
  )) {
    if (value === undefined) {
      continue;
    }
    yield [key, value] as const;
  }
}

async function* mergePendingChangesWithDeletes(
  source: AsyncIterator<readonly [string, JSONValue], void, unknown>,
  pending: Iterator<readonly [string, JSONValue | undefined], void>
) {
  let nextSource = await source.next();
  let nextPending = pending.next();

  const advanceSource = async () => {
    const t = nextSource.value!;
    nextSource = await source.next();
    return t;
  };

  const advancePending = () => {
    const t = nextPending.value!;
    nextPending = pending.next();
    return t;
  };

  for (;;) {
    if (nextPending.done && nextSource.done) {
      break;
    }
    if (nextPending.done) {
      yield advanceSource();
      continue;
    }
    if (nextSource.done) {
      yield advancePending();
      continue;
    }
    const [sourceKey] = nextSource.value;
    const [pendingKey] = nextPending.value;
    // TODO: Need to be careful to match the comparison the database uses.
    if (sourceKey < pendingKey) {
      yield advanceSource();
    } else if (sourceKey > pendingKey) {
      yield advancePending();
    } else {
      advanceSource();
      yield advancePending();
    }
  }
}
