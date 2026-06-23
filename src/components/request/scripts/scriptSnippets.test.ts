import { describe, expect, test } from "bun:test";

import { SNIPPET_GROUPS } from "@/components/request/scripts/scriptSnippets";

describe("SNIPPET_GROUPS", () => {
  test("contains variable, workflow, and test snippets with executable code", () => {
    expect(SNIPPET_GROUPS.map((group) => group.category)).toEqual([
      "Variables",
      "Workflows",
      "Tests",
    ]);
    expect(
      SNIPPET_GROUPS.flatMap((group) => group.items).every(
        (item) => item.name && item.code,
      ),
    ).toBe(true);
    expect(
      SNIPPET_GROUPS.find((group) => group.category === "Tests")?.items.some(
        (item) => item.code.includes("pm.test"),
      ),
    ).toBe(true);
  });
});
