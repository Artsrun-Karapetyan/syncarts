import { describe, expect, test } from "bun:test";

import { walkRenameTargets } from "./walkRenameTargets";

describe("walkRenameTargets", () => {
  test("returns true if target ID matches a request ID at the root level", () => {
    const items: any[] = [{ id: "r1", type: "request" }];
    expect(walkRenameTargets(items, "r1")).toBe(true);
  });

  test("returns true if target ID matches an example ID inside a request", () => {
    const items: any[] = [
      {
        id: "r1",
        type: "request",
        examples: [{ id: "ex1" }],
      },
    ];
    expect(walkRenameTargets(items, "ex1")).toBe(true);
  });

  test("returns true if target ID matches a nested folder", () => {
    const items: any[] = [
      {
        id: "f1",
        type: "folder",
        items: [{ id: "f2", type: "folder", items: [] }],
      },
    ];
    expect(walkRenameTargets(items, "f2")).toBe(true);
  });

  test("returns false if target ID is not found in folders, requests, or examples", () => {
    const items: any[] = [
      {
        id: "f1",
        type: "folder",
        items: [{ id: "r1", type: "request", examples: [] }],
      },
    ];
    expect(walkRenameTargets(items, "not-found")).toBe(false);
  });
});
