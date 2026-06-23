import { describe, expect, test } from "bun:test";

import { getScriptSuggestions } from "@/components/request/scripts/scriptAutocompleteData";

describe("getScriptSuggestions", () => {
  test("returns root suggestions filtered by prefix", () => {
    const suggestions = getScriptSuggestions("", "pm");

    expect(suggestions).toHaveLength(1);
    expect(suggestions[0]).toMatchObject({
      label: "pm",
      kind: "variable",
    });
  });

  test("returns member suggestions and falls back for unknown nested paths", () => {
    expect(getScriptSuggestions("pm.response", "j")[0]).toMatchObject({
      label: "json",
      kind: "method",
    });
    expect(getScriptSuggestions("custom.helper", "ca")[0]).toMatchObject({
      label: "call",
      kind: "method",
    });
  });
});
