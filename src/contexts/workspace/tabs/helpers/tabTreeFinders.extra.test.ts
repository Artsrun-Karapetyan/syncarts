import { describe, expect, test } from "bun:test";
import { findFolder } from "./tabTreeFinders";

describe("tabTreeFinders extra cases", () => {
  test("findFolder finds deeply nested folder", () => {
    const items = [
      {
        type: "folder",
        id: "f1",
        items: [
          { type: "folder", id: "f2", items: [] }
        ]
      }
    ] as any[];

    const result = findFolder(items, "f2");
    expect(result?.id).toBe("f2");
  });
});
