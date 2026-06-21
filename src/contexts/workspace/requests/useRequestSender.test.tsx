import { act, renderHook } from "@testing-library/react";
import { describe, expect, mock, test } from "bun:test";

const mockRunWorkspaceRequest = mock(() =>
  Promise.resolve({
    consoleLogs: ["Log 1"],
    response: {
      status: 200,
      status_text: "OK",
      headers: {},
      body: "OK",
      time_ms: 50,
    },
    testResults: [{ name: "t1", passed: true }],
  }),
);

mock.module("./runWorkspaceRequest", () => ({
  runWorkspaceRequest: mockRunWorkspaceRequest,
}));

import { useRequestSender } from "./useRequestSender";

describe("useRequestSender", () => {
  const defaultArgs = () => ({
    activeEnvironment: undefined,
    activeEnvironmentId: null,
    activeTab: {
      id: "tab-123",
      name: "Tab",
      type: "request" as const,
      method: "GET",
      url: "http://test.com",
      headers: [],
      queryParams: [],
      body: "",
      collectionId: "col-123",
      savedRequestId: "req-123",
      response: null,
    },
    collections: [{ id: "col-123", name: "Col", variables: [], items: [] }],
    environments: [],
    globalVariables: [],
    updateActiveTab: mock(),
    updateCollection: mock(),
    updateFolder: mock(),
    updateEnvironment: mock(),
    updateGlobalVariables: mock(),
    responseCache: {},
    updateResponseCache: mock(),
    secrets: {},
  });

  test("sends request successfully and calls updates", async () => {
    const args = defaultArgs();
    const { result } = renderHook(() => useRequestSender(args as any));

    let response: any;
    await act(async () => {
      response = await result.current.sendRequest();
    });

    expect(response).toBeDefined();
    expect(response?.status).toBe(200);
    expect(mockRunWorkspaceRequest).toHaveBeenCalled();
    expect(args.updateActiveTab).toHaveBeenCalledWith({ response: null });
    expect(args.updateResponseCache).toHaveBeenCalledWith(
      "req-123",
      response as any,
    );
  });

  test("handles runWorkspaceRequest failure and sets error state", async () => {
    mockRunWorkspaceRequest.mockRejectedValueOnce(new Error("Network Error"));
    const args = defaultArgs();
    const { result } = renderHook(() => useRequestSender(args as any));

    let response: any;
    await act(async () => {
      response = await result.current.sendRequest();
    });

    expect(response?.status).toBe(0);
    expect(result.current.error).toBeDefined();
    expect(args.updateActiveTab).toHaveBeenCalled();
  });
});
