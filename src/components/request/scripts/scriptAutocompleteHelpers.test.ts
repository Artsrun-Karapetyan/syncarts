import { describe, expect, test } from "bun:test";

import {
  headerSuggestions,
  item,
  variableStoreSuggestions,
} from "@/components/request/scripts/scriptAutocompleteHelpers";

describe("scriptAutocompleteHelpers", () => {
  test("creates suggestion items with stable fields", () => {
    expect(
      item("log", "log()", "method", "Write log", "(...args) => void"),
    ).toEqual({
      label: "log",
      insertText: "log()",
      kind: "method",
      detail: "Write log",
      typeText: "(...args) => void",
    });
  });

  test("builds variable and header helper suggestions", () => {
    expect(
      variableStoreSuggestions("Env").map((suggestion) => suggestion.label),
    ).toEqual(["get", "set", "unset"]);
    expect(
      headerSuggestions("Header").map((suggestion) => suggestion.label),
    ).toEqual(["get", "has", "all", "add", "upsert", "remove"]);
  });
});
