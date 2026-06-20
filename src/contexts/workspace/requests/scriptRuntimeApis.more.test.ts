import { describe, expect, test } from "bun:test";

import type {
  Environment,
  EnvironmentVariable,
} from "@/contexts/workspace/core/types";
import {
  createVariablesApi,
  replaceDraftVariables,
  sendRequest,
} from "@/contexts/workspace/requests/scriptRuntimeApis";
import { createScriptResponseBody } from "@/contexts/workspace/requests/scriptRuntimeResponse";

describe("scriptRuntimeApis extra cases", () => {
  test("get resolves from ancestors, collection, and globals", () => {
    const variables = createVariablesApi({
      activeEnvironmentId: "none",
      ancestors: [
        { variables: [{ key: "anc", value: "anc-val", enabled: true }] },
      ],
      collectionVariablesDraft: [
        { id: "c1", key: "col", value: "col-val", enabled: true },
      ],
      environments: [],
      globalVariables: [
        { id: "g1", key: "glo", value: "glo-val", enabled: true },
      ],
      updateEnvironment: () => {},
      updateGlobalVariables: () => {},
    });

    expect(variables.get("anc")).toBe("anc-val");
    expect(variables.get("col")).toBe("col-val");
    expect(variables.get("glo")).toBe("glo-val");
  });

  test("set and unset work for globals when no env is active", () => {
    let globals: EnvironmentVariable[] = [];
    const variables = createVariablesApi({
      activeEnvironmentId: "none",
      ancestors: [],
      collectionVariablesDraft: [],
      environments: [],
      globalVariables: globals,
      updateEnvironment: () => {},
      updateGlobalVariables: (next) => {
        globals = next;
      },
    });

    variables.set("newKey", "newVal");
    expect(globals).toHaveLength(1);
    expect(globals[0].key).toBe("newKey");

    variables.unset("newKey");
    expect(globals).toHaveLength(0);
  });

  test("unset works for active environment", () => {
    const env: Environment = {
      id: "env",
      name: "Env",
      variables: [{ id: "v", key: "k", value: "v", enabled: true }],
    };
    let updatedEnv: Partial<Environment> | null = null;
    const variables = createVariablesApi({
      activeEnvironmentId: "env",
      ancestors: [],
      collectionVariablesDraft: [],
      environments: [env],
      globalVariables: [],
      updateEnvironment: (id, data) => {
        updatedEnv = data;
      },
      updateGlobalVariables: () => {},
    });

    variables.unset("k");
    expect(updatedEnv?.variables).toHaveLength(0);
  });

  test("replaceDraftVariables overwrites array in place", () => {
    const target: EnvironmentVariable[] = [
      { id: "1", key: "a", value: "a", enabled: true },
    ];
    const next: EnvironmentVariable[] = [
      { id: "2", key: "b", value: "b", enabled: true },
    ];
    replaceDraftVariables(target, next);
    expect(target).toHaveLength(1);
    expect(target[0].key).toBe("b");
  });

  test("sendRequest handles successful fetch", async () => {
    // Mock global fetch
    const originalFetch = global.fetch;
    global.fetch = async () =>
      new Response("hello world", {
        status: 200,
        statusText: "OK",
        headers: { "x-custom": "test" },
      });

    try {
      const response = await sendRequest({ url: "https://example.com" });
      expect(response.code).toBe(200);
      expect(response.status).toBe("OK");
      expect(response.text()).toBe("hello world");
      expect(response.headers.get("x-custom")).toBe("test");
    } finally {
      global.fetch = originalFetch;
    }
  });

  test("sendRequest handles fetch errors", async () => {
    const originalFetch = global.fetch;
    global.fetch = async () => {
      throw new Error("Network Error");
    };

    try {
      await expect(sendRequest("https://error.com")).rejects.toThrow(
        "Network Error",
      );
    } finally {
      global.fetch = originalFetch;
    }
  });

  test("scriptRuntimeResponse assertions work", () => {
    const res = createScriptResponseBody({
      body: '{"a":1}',
      headers: { "X-Test": "123" },
      responseTime: 10,
      status: 201,
      statusText: "Created",
      stringStatusMode: "okCreated",
    });

    expect(res.json()).toEqual({ a: 1 });
    expect(res.headers.all()).toEqual({ "X-Test": "123" });
    expect(res.headers.has("x-test")).toBe(true);

    // Should not throw
    res.to.have.status(201);
    res.to.have.status("Created");
    res.to.have.body('{"a":1}');
    res.to.have.header("x-test");

    // Should throw
    expect(() => res.to.have.status(200)).toThrow();
    expect(() => res.to.have.body("wrong")).toThrow();
    expect(() => res.to.have.header("missing")).toThrow();

    // Cover okCreated mismatch
    const badOk = createScriptResponseBody({
      body: "",
      headers: {},
      responseTime: 0,
      status: 400,
      statusText: "Bad Request",
      stringStatusMode: "okCreated",
    });
    expect(() => badOk.to.have.status("OK")).toThrow();

    // Cover statusText mode mismatch
    const textRes = createScriptResponseBody({
      body: "",
      headers: {},
      responseTime: 0,
      status: 200,
      statusText: "OK",
      stringStatusMode: "statusText",
    });
    expect(() => textRes.to.have.status("Created")).toThrow();
  });
});
