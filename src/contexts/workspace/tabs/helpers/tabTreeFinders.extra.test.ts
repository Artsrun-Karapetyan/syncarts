import { describe, expect, test } from "bun:test";

import { findExample, findFolder } from "./tabTreeFinders";

describe("tabTreeFinders extra cases", () => {
  // Test 1 (existing)
  test("findFolder finds deeply nested folder", () => {
    const items = [
      {
        type: "folder",
        id: "f1",
        items: [{ type: "folder", id: "f2", items: [] }],
      },
    ] as any[];

    const result = findFolder(items, "f2");
    expect(result?.id).toBe("f2");
  });

  // Test 2
  test("findFolder returns null when folderId is not found", () => {
    const items = [{ type: "folder", id: "f1", items: [] }] as any[];
    expect(findFolder(items, "non-existent")).toBeNull();
  });

  // Test 3
  test("findFolder returns null for empty items array", () => {
    expect(findFolder([], "f1")).toBeNull();
  });

  // Test 4
  test("findFolder ignores requests and only scans folder elements", () => {
    const items = [
      { type: "request", id: "r1" },
      { type: "folder", id: "f1", items: [] },
    ] as any[];
    expect(findFolder(items, "r1")).toBeNull();
  });

  // Test 5
  test("findExample returns null if exampleId is not found", () => {
    const items = [
      { type: "request", id: "r1", examples: [{ id: "ex1" }] },
    ] as any[];
    expect(findExample(items, "non-existent")).toBeNull();
  });

  // Test 6
  test("findExample finds example inside a request at the root level", () => {
    const items = [
      {
        type: "request",
        id: "r1",
        examples: [{ id: "ex1", name: "Example 1" }],
      },
    ] as any[];
    const result = findExample(items, "ex1");
    expect(result?.name).toBe("Example 1");
  });

  // Test 7
  test("findExample finds example inside a request nested inside a folder", () => {
    const items = [
      {
        type: "folder",
        id: "f1",
        items: [
          {
            type: "request",
            id: "r1",
            examples: [{ id: "ex2", name: "Example 2" }],
          },
        ],
      },
    ] as any[];
    const result = findExample(items, "ex2");
    expect(result?.name).toBe("Example 2");
  });
});
