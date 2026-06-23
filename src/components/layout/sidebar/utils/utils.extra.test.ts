import { describe, expect, test } from "bun:test";

import { findExamplePath } from "./utils";

describe("sidebar utils extra cases 2", () => {
  test("findExamplePath finds example deeply nested", () => {
    const collections = [
      {
        id: "c1",
        items: [
          {
            type: "folder",
            id: "f1",
            items: [
              {
                type: "request",
                id: "r1",
                examples: [{ id: "ex1" }],
              },
            ],
          },
        ],
      },
    ] as any[];

    const result = findExamplePath(collections, "ex1");
    expect(result).toEqual({
      collectionId: "c1",
      folderIds: ["f1"],
      requestId: "r1",
    });
  });

  test("findExamplePath returns null if not found", () => {
    const result = findExamplePath([{ id: "c1", items: [] }] as any[], "ex1");
    expect(result).toBeNull();
  });
});
