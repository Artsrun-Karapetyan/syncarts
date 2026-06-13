import { describe, expect, test } from "bun:test";

import {
  resolveDynamicVariable,
  resolveScopedVariable,
} from "./variableResolution";

describe("variableResolution extra cases", () => {
  test("resolves dynamic variables and missing variables", () => {
    expect(resolveDynamicVariable("$timestamp")).toMatch(/^\d+$/);
    expect(resolveDynamicVariable("unknown")).toBeNull();
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
});
