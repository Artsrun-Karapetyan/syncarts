import { describe, expect, test } from "bun:test";

import type { SavedRequest, Workspace } from "@/contexts/workspace/core/types";

import {
  createWorkspaceEventSource,
  replaceRealtimeRequest,
} from "./workspaceRealtimeHelpers";

// Mock localStorage for getToken
Object.defineProperty(window, "localStorage", {
  value: {
    getItem: (key: string) =>
      key === "syncarts_auth_token" ? "mock-token" : null,
    setItem: () => {},
    removeItem: () => {},
  },
  writable: true,
});

// Mock EventSource (not supported in jsdom)
const capturedUrls: string[] = [];
class MockEventSource {
  url: string;
  constructor(url: string) {
    this.url = url;
    capturedUrls.push(url);
  }
  close() {}
}
(globalThis as any).EventSource = MockEventSource;

function makeWorkspace(overrides: Partial<Workspace> = {}): Workspace {
  return {
    id: "ws-1",
    name: "WS",
    collections: [],
    ...overrides,
  };
}

function makeRequest(overrides: Partial<SavedRequest> = {}): SavedRequest {
  return {
    type: "request",
    id: "req-1",
    name: "Req",
    method: "GET",
    url: "http://example.com",
    headers: [],
    body: "",
    collectionId: "col-1",
    ...overrides,
  };
}

describe("createWorkspaceEventSource", () => {
  test("returns EventSource when token exists", () => {
    const es = createWorkspaceEventSource("ws-1");
    expect(es).not.toBeNull();
    expect(es?.url).toContain("ws-1");
    expect(es?.url).toContain("access_token=mock-token");
    es?.close();
  });
});

describe("replaceRealtimeRequest", () => {
  test("returns needsReload when workspace not found", () => {
    const result = replaceRealtimeRequest([], "ws-missing", makeRequest(), {
      type: "update",
      workspaceId: "ws-missing",
      entityType: "request",
    });
    expect(result.needsReload).toBe(true);
    expect(result.changed).toBe(false);
  });

  test("returns needsReload when request not found in collections", () => {
    const ws = makeWorkspace({ id: "ws-1", collections: [] });
    const result = replaceRealtimeRequest(
      [ws],
      "ws-1",
      makeRequest({ id: "req-999" }),
      { type: "update", workspaceId: "ws-1", entityType: "request" },
    );
    expect(result.needsReload).toBe(true);
    expect(result.changed).toBe(false);
  });

  test("returns needsReload when collectionId changed", () => {
    const request = makeRequest({ id: "req-1", collectionId: "col-1" });
    const ws = makeWorkspace({
      id: "ws-1",
      collections: [{ id: "col-1", name: "Col", items: [request] }],
    });
    // request.collectionId is "col-1" but new collectionId is "col-2"
    const updatedRequest = makeRequest({
      id: "req-1",
      collectionId: "col-2",
    });
    const result = replaceRealtimeRequest([ws], "ws-1", updatedRequest, {
      type: "update",
      workspaceId: "ws-1",
      entityType: "request",
    });
    expect(result.needsReload).toBe(true);
  });

  test("returns needsReload when folderId changed", () => {
    const request = makeRequest({ id: "req-1", folderId: "folder-1" });
    const ws = makeWorkspace({
      id: "ws-1",
      collections: [{ id: "col-1", name: "Col", items: [request] }],
    });
    const updatedRequest = makeRequest({
      id: "req-1",
      collectionId: undefined,
      folderId: "folder-2",
    });
    const result = replaceRealtimeRequest([ws], "ws-1", updatedRequest, {
      type: "update",
      workspaceId: "ws-1",
      entityType: "request",
    });
    expect(result.needsReload).toBe(true);
  });

  test("replaces request in-place when found", () => {
    const existingRequest = makeRequest({ id: "req-1", url: "http://old.com" });
    const ws = makeWorkspace({
      id: "ws-1",
      collections: [{ id: "col-1", name: "Col", items: [existingRequest] }],
    });
    const updatedRequest = makeRequest({ id: "req-1", url: "http://new.com" });
    const event = {
      type: "update",
      workspaceId: "ws-1",
      entityType: "request",
      updatedAt: "2024-01-01",
      workspaceVersion: 2,
    };
    const result = replaceRealtimeRequest([ws], "ws-1", updatedRequest, event);

    expect(result.changed).toBe(true);
    expect(result.needsReload).toBe(false);

    const updatedWs = result.workspaces.find((w) => w.id === "ws-1")!;
    const updatedItem = updatedWs.collections[0].items[0] as SavedRequest;
    expect(updatedItem.url).toBe("http://new.com");
    expect(updatedWs.updatedAt).toBe("2024-01-01");
    expect(updatedWs.version).toBe(2);
  });

  test("preserves other workspaces unchanged", () => {
    const request = makeRequest();
    const ws1 = makeWorkspace({
      id: "ws-1",
      collections: [{ id: "col-1", name: "Col", items: [request] }],
    });
    const ws2 = makeWorkspace({ id: "ws-2", name: "Other" });

    const result = replaceRealtimeRequest(
      [ws1, ws2],
      "ws-1",
      makeRequest({ url: "http://updated.com" }),
      { type: "update", workspaceId: "ws-1", entityType: "request" },
    );

    const ws2After = result.workspaces.find((w) => w.id === "ws-2")!;
    expect(ws2After).toBe(ws2); // same reference
  });
});
