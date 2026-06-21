import { describe, expect, mock, test } from "bun:test";

import { createScriptApi, createScriptConsole } from "./scriptRuntime";

describe("scriptRuntime", () => {
  test("createScriptConsole logs messages", () => {
    const logs: string[] = [];
    const consoleObj = createScriptConsole(logs);
    consoleObj.log("hello", "world");
    consoleObj.warn("watch", "out");
    consoleObj.error("bad", "thing");

    expect(logs).toContain("hello world");
    expect(logs).toContain("[WARN] watch out");
    expect(logs).toContain("[ERROR] bad thing");
  });

  test("createScriptApi handles variables correctly", () => {
    const testResults: any[] = [];
    const updateEnvironment = mock();
    const updateGlobalVariables = mock();

    const sy = createScriptApi({
      activeEnvironmentId: "env-1",
      collectionVariablesDraft: [
        { id: "1", key: "cVar", value: "cVal", enabled: true },
      ],
      environments: [
        {
          id: "env-1",
          name: "Env 1",
          variables: [{ id: "e1", key: "eVar", value: "eVal", enabled: true }],
        },
      ],
      globalVariables: [
        { id: "g1", key: "gVar", value: "gVal", enabled: true },
      ],
      ancestors: [],
      requestDraft: {
        id: "tab-1",
        name: "req",
        type: "request",
        method: "GET",
        url: "",
        headers: [],
        queryParams: [],
        body: "",
        response: null,
      },
      testResults,
      updateEnvironment,
      updateGlobalVariables,
    });

    // Test environment set/get/unset
    expect(sy.environment.get("eVar")).toBe("eVal");
    sy.environment.set("eVar", "newVal");
    expect(updateEnvironment).toHaveBeenCalled();

    // Test collectionVariables
    expect(sy.collectionVariables.get("cVar")).toBe("cVal");
    sy.collectionVariables.set("cVar", "newCVal");
    expect(sy.collectionVariables.get("cVar")).toBe("newCVal");

    // Test globals
    expect(sy.globals.get("gVar")).toBe("gVal");
    sy.globals.set("gVar", "newGVal");
    expect(updateGlobalVariables).toHaveBeenCalled();

    // Test variables API unified get
    expect(sy.variables.get("eVar")).toBe("eVal");
    expect(sy.variables.get("cVar")).toBe("newCVal");
    expect(sy.variables.get("gVar")).toBe("gVal");
  });

  test("createScriptApi tests and expectations helper", () => {
    const testResults: any[] = [];
    const sy = createScriptApi({
      activeEnvironmentId: null,
      collectionVariablesDraft: [],
      environments: [],
      globalVariables: [],
      ancestors: [],
      requestDraft: {
        id: "tab-1",
        name: "req",
        type: "request",
        method: "GET",
        url: "",
        headers: [],
        queryParams: [],
        body: "",
        response: null,
      },
      testResults,
      updateEnvironment: mock(),
      updateGlobalVariables: mock(),
    });

    sy.test("should pass", () => {
      sy.expect(10).to.eql(10);
      sy.expect(5).to.be.below(10);
      sy.expect("hello").to.include("ell");
    });

    sy.test("should fail", () => {
      sy.expect(5).to.eql(10);
    });

    expect(testResults[0].passed).toBe(true);
    expect(testResults[1].passed).toBe(false);
  });
});
