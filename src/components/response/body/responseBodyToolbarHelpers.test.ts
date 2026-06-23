import { describe, expect, it } from "bun:test";

import {
  countMatches,
  formatButtonClass,
  getNextMatchIndex,
  toolButtonClass,
} from "@/components/response/body/responseBodyToolbarHelpers";

describe("responseBodyToolbarHelpers", () => {
  it("counts non-overlapping matches case-insensitively", () => {
    expect(countMatches("Error, error, ERROR", "error")).toBe(3);
    expect(countMatches("aaaa", "aa")).toBe(2);
  });

  it("returns zero matches for blank search", () => {
    expect(countMatches("hello", " ")).toBe(0);
  });

  it("builds active and inactive toolbar classes", () => {
    expect(formatButtonClass(true)).toBe("response-format-button active");
    expect(formatButtonClass(false)).toBe("response-format-button ");
    expect(toolButtonClass(true)).toBe("response-tool-button active");
    expect(toolButtonClass(false)).toBe("response-tool-button ");
  });

  it("moves through match indexes with wraparound", () => {
    expect(getNextMatchIndex(0, 3, true)).toBe(1);
    expect(getNextMatchIndex(3, 3, true)).toBe(1);
    expect(getNextMatchIndex(1, 3, false)).toBe(3);
    expect(getNextMatchIndex(0, 0, true)).toBe(0);
  });
});
