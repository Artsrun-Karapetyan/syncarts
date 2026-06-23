import { describe, expect, test } from "bun:test";

import { formatMergeRequestCreatedAt } from "./mergeRequestDate";

describe("formatMergeRequestCreatedAt", () => {
  test("formats the date string correctly", () => {
    const value = "2026-06-20T12:34:56.000Z";
    const formatted = formatMergeRequestCreatedAt(value);
    expect(formatted).toContain("2026");
    expect(formatted).toContain("12");
  });
});
