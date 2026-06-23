import { describe, expect, test } from "bun:test";

import { getCollectionHealthLabel } from "./getCollectionHealthLabel";

describe("getCollectionHealthLabel", () => {
  test("returns correct status label for health score ranges", () => {
    expect(getCollectionHealthLabel(90)).toBe("Looks good");
    expect(getCollectionHealthLabel(85)).toBe("Looks good");
    expect(getCollectionHealthLabel(80)).toBe("Needs cleanup");
    expect(getCollectionHealthLabel(60)).toBe("Needs cleanup");
    expect(getCollectionHealthLabel(40)).toBe("Needs attention");
  });
});
