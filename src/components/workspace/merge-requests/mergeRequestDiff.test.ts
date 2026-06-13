import { describe, expect, test } from "bun:test";

import { getMergeRequestChanges } from "./mergeRequestDiff";

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
    expect(changes.allChanges.map((item) => item.diffType)).toEqual([
      "added",
      "modified",
      "deleted",
    ]);
  });
});
