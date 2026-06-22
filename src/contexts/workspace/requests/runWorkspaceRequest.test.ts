import { describe, expect, mock, test } from "bun:test";

const mockSendHttpRequest = mock(() =>
  Promise.resolve({
    status: 200,
    status_text: "OK",
    headers: {},
    body: "{}",
    time_ms: 100,
  }),
);
mock.module("@/lib/httpRequestSender", () => ({
  sendHttpRequest: mockSendHttpRequest,
}));

import type {
  Collection,
  Environment,
  EnvironmentVariable,
  TabData,
} from "@/contexts/workspace/core/types";

import { runWorkspaceRequest } from "./runWorkspaceRequest";

// Helper to access mock calls without TS tuple errors
function calls(m: ReturnType<typeof mock>): any[][] {
  return m.mock.calls as any[][];
}

function makeTab(overrides: Partial<TabData> = {}): TabData {
  return {
    id: "tab-1",
    name: "Test",
    method: "GET",
    url: "https://example.com",
    headers: [],
    body: "",
    response: null,
    ...overrides,
  };
}

function makeArgs(
  overrides: Partial<Parameters<typeof runWorkspaceRequest>[0]> = {},
) {
  return {
    activeEnvironment: undefined,
    activeEnvironmentId: null,
    collectionId: undefined,
    collections: [] as Collection[],
    environments: [] as Environment[],
    globalVariables: [] as EnvironmentVariable[],
    requestTab: makeTab(),
    responseCache: {},
    secrets: {},
    updateEnvironment: mock(),
    updateFolder: mock(),
    updateGlobalVariables: mock(),
    ...overrides,
  };
}

describe("runWorkspaceRequest", () => {
  test("runs a basic GET request and returns response", async () => {
    const result = await runWorkspaceRequest(makeArgs());
    expect(result.response.status).toBe(200);
    expect(result.consoleLogs).toBeInstanceOf(Array);
    expect(result.testResults).toBeInstanceOf(Array);
  });

  test("throws when URL is invalid", async () => {
    const args = makeArgs({ requestTab: makeTab({ url: "not-a-url" }) });
    await expect(runWorkspaceRequest(args)).rejects.toThrow();
  });

  test("interpolates environment variables in URL", async () => {
    mockSendHttpRequest.mockReset();
    mockSendHttpRequest.mockResolvedValue({
      status: 200,
      status_text: "OK",
      headers: {},
      body: "",
      time_ms: 50,
    });

    const env: Environment = {
      id: "env-1",
      name: "Dev",
      variables: [
        {
          id: "v1",
          key: "BASE_URL",
          value: "https://api.dev.com",
          enabled: true,
        },
      ],
    };
    const result = await runWorkspaceRequest(
      makeArgs({
        activeEnvironment: env,
        activeEnvironmentId: "env-1",
        requestTab: makeTab({ url: "{{BASE_URL}}/users" }),
      }),
    );
    expect(result.response.status).toBe(200);
    const call = calls(mockSendHttpRequest)[0][0];
    expect(call.url).toBe("https://api.dev.com/users");
  });

  test("includes enabled headers in request", async () => {
    mockSendHttpRequest.mockReset();
    mockSendHttpRequest.mockResolvedValue({
      status: 200,
      status_text: "OK",
      headers: {},
      body: "",
      time_ms: 50,
    });

    await runWorkspaceRequest(
      makeArgs({
        requestTab: makeTab({
          headers: [
            { key: "X-Custom", value: "my-value", enabled: true },
            { key: "X-Disabled", value: "skip", enabled: false },
          ],
        }),
      }),
    );
    const call = calls(mockSendHttpRequest)[0][0];
    expect(call.headers["X-Custom"]).toBe("my-value");
    expect(call.headers["X-Disabled"]).toBeUndefined();
  });

  test("adds Authorization header for bearer auth", async () => {
    mockSendHttpRequest.mockReset();
    mockSendHttpRequest.mockResolvedValue({
      status: 200,
      status_text: "OK",
      headers: {},
      body: "",
      time_ms: 50,
    });

    await runWorkspaceRequest(
      makeArgs({
        requestTab: makeTab({
          authType: "bearer",
          bearerToken: "my-token",
          headers: [],
        }),
      }),
    );
    const call = calls(mockSendHttpRequest)[0][0];
    expect(call.headers.Authorization).toBe("Bearer my-token");
  });

  test("sends raw body when bodyType is raw", async () => {
    mockSendHttpRequest.mockReset();
    mockSendHttpRequest.mockResolvedValue({
      status: 200,
      status_text: "OK",
      headers: {},
      body: "",
      time_ms: 50,
    });

    await runWorkspaceRequest(
      makeArgs({
        requestTab: makeTab({
          body: '{"key": "value"}',
          bodyType: "raw",
        }),
      }),
    );
    const call = calls(mockSendHttpRequest)[0][0];
    expect(call.body.type).toBe("Raw");
    expect(call.body.content).toBe('{"key": "value"}');
  });

  test("sends None body when body is empty", async () => {
    mockSendHttpRequest.mockReset();
    mockSendHttpRequest.mockResolvedValue({
      status: 200,
      status_text: "OK",
      headers: {},
      body: "",
      time_ms: 50,
    });

    await runWorkspaceRequest(
      makeArgs({
        requestTab: makeTab({ body: "   ", bodyType: "raw" }),
      }),
    );
    const call = calls(mockSendHttpRequest)[0][0];
    expect(call.body.type).toBe("None");
  });

  test("sends form-data body", async () => {
    mockSendHttpRequest.mockReset();
    mockSendHttpRequest.mockResolvedValue({
      status: 200,
      status_text: "OK",
      headers: {},
      body: "",
      time_ms: 50,
    });

    await runWorkspaceRequest(
      makeArgs({
        requestTab: makeTab({
          bodyType: "form-data",
          formData: [{ id: "f1", key: "name", value: "test", enabled: true }],
        }),
      }),
    );
    const call = calls(mockSendHttpRequest)[0][0];
    expect(call.body.type).toBe("FormData");
    expect(call.body.items[0].key).toBe("name");
  });

  test("sends x-www-form-urlencoded body", async () => {
    mockSendHttpRequest.mockReset();
    mockSendHttpRequest.mockResolvedValue({
      status: 200,
      status_text: "OK",
      headers: {},
      body: "",
      time_ms: 50,
    });

    await runWorkspaceRequest(
      makeArgs({
        requestTab: makeTab({
          bodyType: "x-www-form-urlencoded",
          formData: [{ id: "f1", key: "token", value: "abc", enabled: true }],
        }),
      }),
    );
    const call = calls(mockSendHttpRequest)[0][0];
    expect(call.body.type).toBe("FormUrlEncoded");
  });

  test("returns collectionId when tab belongs to a collection", async () => {
    mockSendHttpRequest.mockReset();
    mockSendHttpRequest.mockResolvedValue({
      status: 200,
      status_text: "OK",
      headers: {},
      body: "",
      time_ms: 50,
    });

    const col: Collection = {
      id: "col-1",
      name: "Col",
      items: [],
    };
    const result = await runWorkspaceRequest(
      makeArgs({
        collections: [col],
        requestTab: makeTab({ collectionId: "col-1" }),
      }),
    );
    expect(result.collectionId).toBe("col-1");
  });

  test("runs pre-request script", async () => {
    mockSendHttpRequest.mockReset();
    mockSendHttpRequest.mockResolvedValue({
      status: 200,
      status_text: "OK",
      headers: {},
      body: "",
      time_ms: 50,
    });

    const result = await runWorkspaceRequest(
      makeArgs({
        requestTab: makeTab({
          preRequestScript: "console.log('pre')",
        }),
      }),
    );
    expect(result.consoleLogs).toContain("pre");
  });

  test("runs test script after response", async () => {
    mockSendHttpRequest.mockReset();
    mockSendHttpRequest.mockResolvedValue({
      status: 200,
      status_text: "OK",
      headers: {},
      body: "",
      time_ms: 50,
    });

    const result = await runWorkspaceRequest(
      makeArgs({
        requestTab: makeTab({
          testScript: "sy.test('always passes', () => {})",
        }),
      }),
    );
    expect(result.testResults.length).toBeGreaterThan(0);
    expect(result.testResults[0].name).toBe("always passes");
  });

  test("form-data with empty items sends None body", async () => {
    mockSendHttpRequest.mockReset();
    mockSendHttpRequest.mockResolvedValue({
      status: 200,
      status_text: "OK",
      headers: {},
      body: "",
      time_ms: 50,
    });

    await runWorkspaceRequest(
      makeArgs({
        requestTab: makeTab({
          bodyType: "form-data",
          formData: [{ id: "f1", key: "", value: "x", enabled: true }],
        }),
      }),
    );
    const call = calls(mockSendHttpRequest)[0][0];
    expect(call.body.type).toBe("None");
  });

  test("unknown bodyType sends None body", async () => {
    mockSendHttpRequest.mockReset();
    mockSendHttpRequest.mockResolvedValue({
      status: 200,
      status_text: "OK",
      headers: {},
      body: "",
      time_ms: 50,
    });

    await runWorkspaceRequest(
      makeArgs({
        requestTab: makeTab({ bodyType: "none" as any }),
      }),
    );
    const call = calls(mockSendHttpRequest)[0][0];
    expect(call.body.type).toBe("None");
  });
});
