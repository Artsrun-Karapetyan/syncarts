import { describe, expect, it } from "bun:test";

import {
  countMatches,
  getNextMatchIndex,
} from "@/components/response/body/responseBodyToolbarHelpers";

describe("responseBodyToolbarHelpers more cases", () => {
  it("trims the query before matching", () => {
    expect(countMatches("alpha beta alpha", " alpha ")).toBe(2);
  });

  it("returns zero when the query is missing from text", () => {
    expect(countMatches("alpha beta", "gamma")).toBe(0);
  });

  it("moves backward from the current match", () => {
    expect(getNextMatchIndex(3, 5, false)).toBe(2);
  });
});
