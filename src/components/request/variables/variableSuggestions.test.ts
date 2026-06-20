import { describe, expect, test } from "bun:test";

import { getVariableSuggestions } from "@/components/request/variables/variableSuggestions";
import type { EnvironmentVariable } from "@/contexts/WorkspaceContext";

const variable = (
  key: string,
  value: string,
  enabled = true,
): EnvironmentVariable => ({
  id: key,
  key,
  value,
  enabled,
});

describe("getVariableSuggestions", () => {
  test("returns enabled variables by environment, nearest ancestors, globals, and dynamic values", () => {
    const suggestions = getVariableSuggestions({
      activeEnvironment: {
        id: "env",
        name: "Env",
        variables: [variable("token", "env"), variable("disabled", "", false)],
      },
      ancestors: [
        { name: "Collection", variables: [variable("baseUrl", "collection")] },
        {
          type: "folder",
          name: "Folder",
          variables: [variable("folderToken", "folder")],
        },
      ],
      globalVariables: [variable("globalToken", "global")],
      query: "token",
    });

    expect(suggestions.map((item) => item.key)).toEqual([
      "token",
      "folderToken",
      "globalToken",
    ]);
    expect(suggestions.map((item) => item.source)).toEqual([
      "Environment",
      "Folder",
      "Globals",
    ]);
  });
});
