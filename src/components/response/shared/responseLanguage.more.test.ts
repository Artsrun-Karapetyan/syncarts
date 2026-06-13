import { describe, expect, test } from "bun:test";

import { detectResponseLanguage } from "./responseLanguage";

describe("detectResponseLanguage edge cases", () => {
  test("detects xml content type and parsed json fallback", () => {
    expect(detectResponseLanguage("application/xml", "<root />", false)).toBe(
      "xml",
    );
    expect(detectResponseLanguage("text/plain", "{}", true)).toBe("json");
  });

  test("detects debug dump html-like bodies", () => {
    expect(
      detectResponseLanguage("text/plain", "Whoops\\Exception trace", false),
    ).toBe("html");
  });
});
