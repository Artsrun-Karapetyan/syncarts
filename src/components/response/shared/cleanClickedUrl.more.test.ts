import { describe, expect, test } from "bun:test";

import { cleanClickedUrl } from "@/components/response/shared/cleanClickedUrl";

describe("cleanClickedUrl extra cases", () => {
  test("trims whitespace and trailing quote comma", () => {
    expect(cleanClickedUrl('  "https://example.test",  ')).toBe(
      "https://example.test",
    );
  });

  test("keeps already clean urls unchanged", () => {
    expect(cleanClickedUrl("https://example.test/path")).toBe(
      "https://example.test/path",
    );
  });
});
