import { describe, expect, test } from "bun:test";

import type {
  Environment,
  EnvironmentVariable,
  TabData,
} from "@/contexts/workspace/core/types";
import {
  createRequestHeadersApi,
  createVariablesApi,
} from "@/contexts/workspace/requests/scriptRuntimeApis";

function requestDraft(): TabData {
  return {
    id: "tab",
    type: "request",
    name: "Request",
    method: "GET",
    url: "/",
    headers: [{ key: "Accept", value: "application/json" }],
    body: "",
    response: null,
  };
}

describe("scriptRuntimeApis", () => {
  test("mutates request headers through the sandbox header API", () => {
    const request = requestDraft();
    const headers = createRequestHeadersApi(request);

    headers.add("Authorization", "Bearer token");
    headers.upsert({ key: "Accept", value: "text/plain" });
    headers.remove("authorization");

    expect(headers.get("accept")).toBe("text/plain");
    expect(headers.has("Authorization")).toBe(false);
    expect(request.headers).toEqual([{ key: "Accept", value: "text/plain" }]);
  });

  test("resolves and writes variables by environment before globals", () => {
    const env: Environment = {
      id: "env",
      name: "Env",
      variables: [{ id: "env-var", key: "token", value: "env", enabled: true }],
    };
    let updatedEnv: Partial<Environment> | null = null;
    let globals: EnvironmentVariable[] = [
      { id: "global-var", key: "token", value: "global", enabled: true },
    ];
    const variables = createVariablesApi({
      activeEnvironmentId: "env",
      ancestors: [],
      collectionVariablesDraft: [],
      environments: [env],
      globalVariables: globals,
      updateEnvironment: (_id, data) => {
        updatedEnv = data;
      },
      updateGlobalVariables: (next) => {
        globals = next;
      },
    });

    expect(variables.get("token")).toBe("env");
    variables.set("token", "next");
    expect((updatedEnv as any)?.variables?.[0]).toMatchObject({
      key: "token",
      value: "next",
    });
    expect(globals[0].value).toBe("global");
  });
});
