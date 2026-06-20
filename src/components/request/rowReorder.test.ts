import { describe, expect, test } from "bun:test";

import { reorderRows } from "@/components/request/rowReorder";

describe("reorderRows", () => {
  test("moves a row before another row", () => {
    expect(reorderRows(["a", "b", "c"], 2, 0, "before")).toEqual([
      "c",
      "a",
      "b",
    ]);
  });

  test("moves a row after another row", () => {
    expect(reorderRows(["a", "b", "c"], 0, 2, "after")).toEqual([
      "b",
      "c",
      "a",
    ]);
  });

  test("keeps rows unchanged for invalid moves", () => {
    const rows = ["a", "b"];

    expect(reorderRows(rows, 0, 0, "before")).toBe(rows);
    expect(reorderRows(rows, -1, 0, "before")).toBe(rows);
    expect(reorderRows(rows, 0, 9, "before")).toBe(rows);
  });
});
