import { describe, expect, mock, test } from "bun:test";

let mockTokenValue: string | null = "test-token";

mock.module("@/lib/api", () => ({
  getToken: () => mockTokenValue,
  API_URL: "http://api.test",
}));

// Mock EventSource globally
class MockEventSource {
  url: string;
  constructor(url: string) {
    this.url = url;
  }
}
(global as any).EventSource = MockEventSource;

import {
  createWorkspaceEventSource,
  replaceRealtimeRequest,
} from "./workspaceRealtimeHelpers";

describe("workspaceRealtimeHelpers extra cases", () => {
  test("createWorkspaceEventSource returns null if no token", () => {
    mockTokenValue = null;
    const result = createWorkspaceEventSource("w1");
    expect(result).toBeNull();
  });

  test("createWorkspaceEventSource creates EventSource with correct url", () => {
    mockTokenValue = "valid-token";
    const result = createWorkspaceEventSource("w1") as any;
    expect(result).not.toBeNull();
    expect(result.url).toBe(
      "http://api.test/workspaces/w1/events?access_token=valid-token",
    );
  });

  test("replaceRealtimeRequest rejects mismatching folderId", () => {
    const workspaces = [
      {
        id: "w1",
        collections: [
          {
            id: "c1",
            items: [
              {
                type: "folder",
                id: "f1",
                items: [{ type: "request", id: "r1" }],
              },
            ],
          },
        ],
      },
    ] as any[];

    // the request in store is in f1, but the payload says it has no folderId (undefined vs f1)
    const res1 = replaceRealtimeRequest(
      workspaces,
      "w1",
      { id: "r1", collectionId: "c1", folderId: "f2" } as any,
      {} as any,
    );
    expect(res1.changed).toBe(false);

    const res2 = replaceRealtimeRequest(
      workspaces,
      "w1",
      { id: "r1", collectionId: "c1", folderId: undefined } as any,
      {} as any,
    );
    expect(res2.changed).toBe(true);
  });
});
