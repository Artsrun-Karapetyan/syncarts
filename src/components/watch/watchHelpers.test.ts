import { describe, expect, test } from "bun:test";

import {
  buildWatchMap,
  isEntityWatched,
  watchKey,
} from "@/components/watch/watchHelpers";

describe("watchHelpers", () => {
  test("builds stable watch keys", () => {
    expect(watchKey("collection", "c1")).toBe("collection:c1");
  });

  test("checks watched entities", () => {
    const map = buildWatchMap([
      { entityType: "request", entityId: "r1" },
    ] as any);

    expect(isEntityWatched(map, "request", "r1")).toBe(true);
    expect(isEntityWatched(map, "collection", "c1")).toBe(false);
  });
});
