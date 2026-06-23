import { describe, expect, test } from "bun:test";

import { formatDiffValue } from "./mergeRequestDiff";

describe("mergeRequestDiff extra cases", () => {
  test("formatDiffValue handles circular JSON", () => {
    const circular: any = {};
    circular.self = circular;
    const result = formatDiffValue(circular);
    expect(result).toBe("[object Object]"); // String(circular)
  });
});
