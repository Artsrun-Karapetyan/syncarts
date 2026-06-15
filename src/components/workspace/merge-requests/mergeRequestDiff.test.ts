import { describe, expect, test } from "bun:test";

import { formatDiffValue, getMergeRequestChanges } from "./mergeRequestDiff";

describe("getMergeRequestChanges", () => {
  test("detects added, deleted, and modified collection items", () => {
    const targetCollection = {
      items: [
        {
          type: "request",
          id: "shared",
          name: "Shared",
          method: "GET",
          url: "/old",
        },
        { type: "request", id: "deleted", name: "Deleted", method: "GET" },
      ],
    };
    const sourceCollection = {
      items: [
        {
          type: "request",
          id: "shared",
          name: "Shared",
          method: "GET",
          url: "/new",
        },
        { type: "request", id: "added", name: "Added", method: "POST" },
      ],
    };

    const changes = getMergeRequestChanges(targetCollection, sourceCollection);

    expect(changes.added.map((item) => item.id)).toEqual(["added"]);
    expect(changes.deleted.map((item) => item.id)).toEqual(["deleted"]);
    expect(changes.modified[0].changedKeys).toContain("url");
    expect(changes.modified[0].originalItem).toEqual(targetCollection.items[0]);
    expect(changes.allChanges.map((item) => item.diffType)).toEqual([
      "added",
      "modified",
      "deleted",
    ]);
  });

  test("flattens nested folders when diffing", () => {
    const targetCollection = {
      items: [
        {
          type: "folder",
          id: "folder-1",
          name: "Old Folder",
          items: [{ type: "request", id: "req-1", name: "Old Request" }],
        },
      ],
    };
    const sourceCollection = {
      items: [
        {
          type: "folder",
          id: "folder-1",
          name: "New Folder",
          items: [
            { type: "request", id: "req-1", name: "New Request" },
            { type: "request", id: "req-2", name: "Added Request" },
          ],
        },
      ],
    };

    const changes = getMergeRequestChanges(targetCollection, sourceCollection);

    expect(
      changes.modified.find((c: any) => c.id === "folder-1")?.changedKeys,
    ).toContain("name");
    expect(
      changes.modified.find((c: any) => c.id === "req-1")?.changedKeys,
    ).toContain("name");
    expect(changes.added.map((item: any) => item.id)).toEqual(["req-2"]);
  });
});

describe("formatDiffValue", () => {
  test("formats undefined and null correctly", () => {
    expect(formatDiffValue(undefined)).toBe("null");
    expect(formatDiffValue(null)).toBe("null");
  });

  test("formats strings correctly", () => {
    expect(formatDiffValue("hello")).toBe("hello");
  });

  test("formats objects correctly", () => {
    expect(formatDiffValue({ key: "value" })).toBe('{\n  "key": "value"\n}');
  });
});
