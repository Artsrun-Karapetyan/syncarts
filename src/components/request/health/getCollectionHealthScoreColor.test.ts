import { describe, expect, test } from "bun:test";

import { getCollectionHealthScoreColor } from "./getCollectionHealthScoreColor";

describe("getCollectionHealthScoreColor", () => {
  test("returns correct color value for health score ranges", () => {
    expect(getCollectionHealthScoreColor(90)).toBe("var(--status-success)");
    expect(getCollectionHealthScoreColor(85)).toBe("var(--status-success)");
    expect(getCollectionHealthScoreColor(80)).toBe("#eab308");
    expect(getCollectionHealthScoreColor(60)).toBe("#eab308");
    expect(getCollectionHealthScoreColor(40)).toBe("#ef4444");
  });
});
