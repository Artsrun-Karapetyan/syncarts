import { describe, expect, test } from "bun:test";

import {
  resolveDynamicVariable,
  resolveScopedVariable,
  upsertActiveVariableValue,
} from "./variableResolution";

describe("variableResolution extra cases", () => {
  test("resolves dynamic variables and missing variables", () => {
    expect(resolveDynamicVariable("$timestamp")).toMatch(/^\d+$/);
    expect(resolveDynamicVariable("$guid")).not.toBeNull();
    expect(resolveDynamicVariable("$isoTimestamp")).not.toBeNull();
    expect(resolveDynamicVariable("unknown")).toBeNull();

    // Cover lines 51-57 in resolveScopedVariable
    expect(
      resolveScopedVariable({
        activeEnvironment: undefined,
        ancestors: [],
        globalVariables: [],
        varName: "$timestamp",
      }),
    ).toMatchObject({
      exists: true,
      hasValue: true,
      source: "Dynamic",
      sourceType: "Dynamic",
    });

    expect(
      resolveScopedVariable({
        activeEnvironment: undefined,
        ancestors: [],
        globalVariables: [],
        varName: "missing",
      }),
    ).toEqual({
      exists: false,
      hasValue: false,
      value: "",
      source: "Not found",
    });
  });

  test("resolves from outer ancestor if inner ancestor lacks variable", () => {
    // Covers loop continuation (lines 40-41)
    const resolved = resolveScopedVariable({
      ancestors: [
        {
          type: "collection",
          variables: [
            { id: "col", key: "token", value: "collection-val", enabled: true },
          ],
        },
        {
          type: "folder",
          variables: [],
        },
      ],
      globalVariables: [],
      varName: "token",
    });

    expect(resolved).toMatchObject({
      sourceType: "Collection",
      value: "collection-val",
    });
  });

  test("upserts new active variable if not found", () => {
    // Covers line 83 (index !== activeIndex fallback) and new variable insertion
    const result = upsertActiveVariableValue(
      [{ id: "1", key: "other", value: "val", enabled: true }],
      "newvar",
      "newval",
    );
    expect(result).toHaveLength(2);
    expect(result[1].key).toBe("newvar");
    expect(result[1].value).toBe("newval");
  });
});
