import { describe, expect, mock, test } from "bun:test";

let mockGetResult: any = Promise.resolve({ data: null });

mock.module("@/lib/api", () => ({
  api: {
    get: (url: string) => {
      if (url.includes("fail")) {
        return Promise.reject(new Error("API Error"));
      }
      return mockGetResult;
    },
  },
}));

import { hydrateRemoteWorkspaceDetails } from "./remoteWorkspaceDetails";

describe("hydrateRemoteWorkspaceDetails", () => {
  test("returns original remote when it is already detailed (contains data)", async () => {
    const remote = { id: "w1", data: { name: "detailed" } };
    const dirtySet = new Set<string>();
    const syncingSet = new Set<string>();

    const result = await hydrateRemoteWorkspaceDetails([remote], [], {
      dirtyWorkspaceIdsRef: { current: dirtySet } as any,
      syncingWorkspaceIdsRef: { current: syncingSet } as any,
    });
    expect(result[0]).toBe(remote);
  });

  test("fetches and returns remote details on mismatching version", async () => {
    const remote = { id: "w1", version: 2 };
    const local = { id: "w1", version: 1 } as any;
    const dirtySet = new Set<string>();
    const syncingSet = new Set<string>();

    const mockData = { id: "w1", version: 2, name: "Remote Work" };
    mockGetResult = Promise.resolve({ data: mockData });

    const result = await hydrateRemoteWorkspaceDetails([remote], [local], {
      dirtyWorkspaceIdsRef: { current: dirtySet } as any,
      syncingWorkspaceIdsRef: { current: syncingSet } as any,
    });
    expect(result[0]).toEqual(mockData);
  });

  test("does not fetch details if local version matches remote version", async () => {
    const remote = { id: "w1", version: 1 };
    const local = { id: "w1", version: 1 } as any;
    const dirtySet = new Set<string>();
    const syncingSet = new Set<string>();

    const result = await hydrateRemoteWorkspaceDetails([remote], [local], {
      dirtyWorkspaceIdsRef: { current: dirtySet } as any,
      syncingWorkspaceIdsRef: { current: syncingSet } as any,
    });
    expect(result[0]).toBe(remote);
  });

  test("handles fetch errors gracefully and returns remote workspace", async () => {
    const remote = { id: "fail-workspace", version: 2 };
    const local = { id: "fail-workspace", version: 1 } as any;
    const dirtySet = new Set<string>();
    const syncingSet = new Set<string>();

    const originalConsoleError = console.error;
    console.error = () => {}; // Silence error logs

    const result = await hydrateRemoteWorkspaceDetails([remote], [local], {
      dirtyWorkspaceIdsRef: { current: dirtySet } as any,
      syncingWorkspaceIdsRef: { current: syncingSet } as any,
    });

    console.error = originalConsoleError;
    expect(result[0]).toBe(remote);
  });
});
