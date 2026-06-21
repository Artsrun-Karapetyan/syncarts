import { describe, expect, mock, test } from "bun:test";

const mockSend = mock(() =>
  Promise.resolve({
    status: 200,
    status_text: "OK",
    headers: { "content-type": "application/json" },
    body: '{"foo": "bar"}',
    time_ms: 10,
  }),
);

mock.module("@/lib/httpRequestSender", () => ({
  sendHttpRequest: mockSend,
}));

import type { TabData } from "@/contexts/workspace/core/types";

import { runWorkspaceRequest } from "./runWorkspaceRequest";

describe("runWorkspaceRequest", () => {
  const defaultTab = (): TabData => ({
    id: "tab-1",
    name: "Test Tab",
    type: "request",
    method: "GET",
    url: "http://example.com/{{myVar}}",
    headers: [{ key: "X-Test", value: "value-{{myVar}}", enabled: true }],
    queryParams: [],
    body: "",
    preRequestScript: "sy.collectionVariables.set('myVar', 'hello');",
    testScript:
      "sy.test('should be 200', () => { sy.expect(sy.response.code).to.eql(200); });",
    collectionId: "col-1",
    response: null,
  });

  test("runs pre scripts, interpolates url/headers, runs tests, returns results", async () => {
    const tab = defaultTab();
    const updateGlobalVariables = mock();
    const collections = [
      {
        id: "col-1",
        name: "Col 1",
        variables: [],
        items: [],
      },
    ] as any;

    const result = await runWorkspaceRequest({
      activeEnvironment: undefined,
      activeEnvironmentId: null,
      collections,
      environments: [],
      globalVariables: [],
      requestTab: tab,
      responseCache: {},
      secrets: {},
      updateEnvironment: mock(),
      updateFolder: mock(),
      updateGlobalVariables,
    });

    expect(mockSend).toHaveBeenCalled();
    const lastCallArg = (mockSend.mock.calls as any)[0][0];
    expect(lastCallArg.url).toBe("http://example.com/hello");
    expect(lastCallArg.headers["X-Test"]).toBe("value-hello");

    expect(result.testResults.length).toBe(1);
    expect(result.testResults[0].passed).toBe(true);
  });
});
