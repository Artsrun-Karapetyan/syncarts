import { describe, expect, test } from "bun:test";
import { getNextMatchIndex, toolButtonClass, countMatches, formatButtonClass } from "./responseBodyToolbarHelpers";

describe("responseBodyToolbarHelpers extra cases", () => {
  test("getNextMatchIndex edge cases", () => {
    expect(getNextMatchIndex(0, 0, true)).toBe(0);
    expect(getNextMatchIndex(0, 5, true)).toBe(1);
    expect(getNextMatchIndex(0, 5, false)).toBe(5);
    expect(getNextMatchIndex(1, 5, true)).toBe(2);
    expect(getNextMatchIndex(1, 5, false)).toBe(5);
  });

  test("countMatches edge cases", () => {
    expect(countMatches("test test", "")).toBe(0);
    expect(countMatches("test test", "  ")).toBe(0);
  });

  test("toolButtonClass", () => {
    expect(toolButtonClass(true)).toBe("response-tool-button active");
    expect(toolButtonClass(false)).toBe("response-tool-button ");
  });

  test("formatButtonClass", () => {
    expect(formatButtonClass(true)).toBe("response-format-button active");
  });
});
