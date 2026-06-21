import { describe, expect, test } from "bun:test";

import {
  applyPathVariables,
  syncPathVariablesWithUrl,
  upsertPathVariable,
} from "./pathVariables";

describe("pathVariables extra cases 2", () => {
  test("syncPathVariablesWithUrl with no variables keeps existing keys", () => {
    const vars = syncPathVariablesWithUrl("/:id", undefined);
    expect(vars.length).toBe(1);
    expect(vars[0].key).toBe("id");
  });

  test("upsertPathVariable when variables array is undefined", () => {
    const result = upsertPathVariable(undefined, "id", "value1", "desc1");
    expect(result.length).toBe(1);
    expect(result[0].key).toBe("id");
    expect(result[0].value).toBe("value1");
    expect(result[0].description).toBe("desc1");
  });

  test("upsertPathVariable updates existing value but keeps description if not provided", () => {
    const initial = [
      { id: "1", key: "id", value: "old", description: "old_desc" },
    ];
    const result = upsertPathVariable(initial, "id", "new");
    expect(result[0].value).toBe("new");
    expect(result[0].description).toBe("old_desc");
  });

  test("applyPathVariables with empty url or no variables", () => {
    expect(applyPathVariables("", [])).toBe("");
    expect(applyPathVariables("http://test", [])).toBe("http://test");
  });

  test("applyPathVariables returns match if variable exists but value is empty", () => {
    const vars = [{ id: "1", key: "id", value: "", description: "" }];
    expect(applyPathVariables("/:id", vars)).toBe("/:id");
  });
});
