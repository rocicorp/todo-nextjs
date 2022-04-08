import { expect } from "chai";
import { test } from "mocha";
import { JSONValue } from "replicache";
import { mergePendingChanges } from "./merge-pending";

test("mergePendingChanges", async () => {
  type Case = {
    name: string;
    source: [string, JSONValue][];
    pending: [string, JSONValue | undefined][];
    expected: [string, JSONValue][];
  };
  const cases: Case[] = [
    {
      name: "both empty",
      source: [],
      pending: [],
      expected: [],
    },
    {
      name: "source empty",
      source: [],
      pending: [
        ["a", 1],
        ["b", 1],
      ],
      expected: [
        ["a", 1],
        ["b", 1],
      ],
    },
    {
      name: "pending empty",
      source: [
        ["a", 1],
        ["b", 1],
      ],
      pending: [],
      expected: [
        ["a", 1],
        ["b", 1],
      ],
    },
    {
      name: "pending precedes",
      source: [
        ["c", 1],
        ["d", 1],
      ],
      pending: [
        ["a", 1],
        ["b", 1],
      ],
      expected: [
        ["a", 1],
        ["b", 1],
        ["c", 1],
        ["d", 1],
      ],
    },
    {
      name: "pending follows",
      source: [
        ["a", 1],
        ["b", 1],
      ],
      pending: [
        ["c", 1],
        ["d", 1],
      ],
      expected: [
        ["a", 1],
        ["b", 1],
        ["c", 1],
        ["d", 1],
      ],
    },
    {
      name: "pending middle",
      source: [
        ["a", 1],
        ["d", 1],
      ],
      pending: [
        ["b", 1],
        ["c", 1],
      ],
      expected: [
        ["a", 1],
        ["b", 1],
        ["c", 1],
        ["d", 1],
      ],
    },
    {
      name: "pending interleaved",
      source: [
        ["b", 1],
        ["d", 1],
      ],
      pending: [
        ["a", 1],
        ["c", 1],
        ["e", 1],
      ],
      expected: [
        ["a", 1],
        ["b", 1],
        ["c", 1],
        ["d", 1],
        ["e", 1],
      ],
    },
    {
      name: "pending overwrite",
      source: [["a", 1]],
      pending: [["a", 2]],
      expected: [["a", 2]],
    },
    {
      name: "pending delete",
      source: [["a", 1]],
      pending: [["a", undefined]],
      expected: [],
    },
  ];
  async function* sourceIter(source: [string, JSONValue][]) {
    for (const s of source) {
      yield s;
    }
  }
  function* pendingIter(pending: [string, JSONValue | undefined][]) {
    for (const s of pending) {
      yield s;
    }
  }
  for (const c of cases) {
    const merged = mergePendingChanges(
      sourceIter(c.source),
      pendingIter(c.pending)
    );
    const mergedArr = [];
    for await (const entry of merged) {
      mergedArr.push(entry);
    }
    expect(mergedArr).to.deep.equal(c.expected, c.name);
  }
});
