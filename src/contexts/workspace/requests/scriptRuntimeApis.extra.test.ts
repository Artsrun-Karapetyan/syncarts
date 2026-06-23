import { describe, expect, mock, test } from "bun:test";

import { createVariablesApi, upsertVariable } from "./scriptRuntimeApis";

describe("scriptRuntimeApis extra cases", () => {
  test("createVariablesApi sets variable in active environment", () => {
    const updateEnvironment = mock();
    const updateGlobalVariables = mock();

    const api = createVariablesApi({
      activeEnvironmentId: "env1",
      ancestors: [],
      collectionVariablesDraft: [],
      environments: [{ id: "env1", variables: [] } as any],
      globalVariables: [],
      updateEnvironment,
      updateGlobalVariables,
    });

    api.set("key1", "val1");

    expect(updateEnvironment).toHaveBeenCalled();
    const callArgs = updateEnvironment.mock.calls[0];
    expect(callArgs[0]).toBe("env1");
    expect(callArgs[1].variables[0].key).toBe("key1");
    expect(callArgs[1].variables[0].value).toBe("val1");
  });

  test("upsertVariable updates existing value", () => {
    const vars = [{ id: "1", key: "existing", value: "old", enabled: true }];
    const res = upsertVariable(vars, "existing", "new");
    expect(res[0].value).toBe("new");
  });
});
