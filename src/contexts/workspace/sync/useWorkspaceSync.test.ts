import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, mock, test } from "bun:test";

const mockApiGet = mock(() => Promise.resolve({ data: [] }));
const mockApiPut = mock(() => Promise.resolve({ data: null }));
mock.module("@/lib/api", () => ({
  api: { get: mockApiGet, put: mockApiPut },
}));

const mockGetAuthToken = mock(() => "mock-token");
mock.module("@/lib/auth", () => ({
  getAuthToken: mockGetAuthToken,
}));

const mockHydrateRemoteWorkspaceDetails = mock(
  async (remotes: any[]) => remotes,
);
mock.module("@/contexts/workspace/sync/remoteWorkspaceDetails", () => ({
  hydrateRemoteWorkspaceDetails: mockHydrateRemoteWorkspaceDetails,
}));

// Minimal mocks for realtime / sub-hooks
mock.module("@/contexts/workspace/sync/useWorkspaceRealtime", () => ({
  useWorkspaceRealtime: mock(),
}));

import type { Workspace } from "@/contexts/workspace/core/types";

import { useWorkspaceSync } from "./useWorkspaceSync";

function makeWorkspace(id = "ws-1"): Workspace {
  return { id, name: "WS", collections: [], type: "cloud" };
}

function makeArgs(
  overrides: Partial<Parameters<typeof useWorkspaceSync>[0]> = {},
) {
  return {
    activeWorkspaceId: "ws-1",
    deletedWorkspaceIdsRef: { current: new Set<string>() },
    dirtyWorkspaceIdsRef: { current: new Set<string>() },
    lastSyncedSignaturesRef: { current: {} },
    localDefaultWorkspaceId: "local-user1",
    setWorkspaces: mock(),
    storageHydrated: true,
    syncingWorkspaceIdsRef: { current: new Set<string>() },
    userId: "user1",
    workspaces: [makeWorkspace()],
    ...overrides,
  };
}

describe("useWorkspaceSync", () => {
  beforeEach(() => {
    mockApiGet.mockReset();
    mockApiGet.mockResolvedValue({ data: [] });
    mockApiPut.mockReset();
    mockApiPut.mockResolvedValue({ data: null });
    mockHydrateRemoteWorkspaceDetails.mockReset();
    mockHydrateRemoteWorkspaceDetails.mockResolvedValue([]);
    mockGetAuthToken.mockReturnValue("mock-token");
  });

  test("returns reloadWorkspaces function", () => {
    const args = makeArgs();
    const { result } = renderHook(() => useWorkspaceSync(args));
    expect(typeof result.current.reloadWorkspaces).toBe("function");
  });

  test("reloadWorkspaces no-ops when no auth token", async () => {
    mockGetAuthToken.mockReturnValue(null as any);
    const args = makeArgs();
    const { result } = renderHook(() => useWorkspaceSync(args));

    await act(async () => {
      await result.current.reloadWorkspaces();
    });

    expect(mockApiGet).not.toHaveBeenCalled();
  });

  test("reloadWorkspaces calls api.get /workspaces when token exists", async () => {
    const args = makeArgs();
    const { result } = renderHook(() => useWorkspaceSync(args));

    await act(async () => {
      await result.current.reloadWorkspaces();
    });

    expect(mockApiGet).toHaveBeenCalledWith("/workspaces");
  });

  test("reloadWorkspaces filters deleted workspaces", async () => {
    const ws = makeWorkspace("ws-deleted");
    mockApiGet.mockResolvedValue({ data: [ws] } as any);
    mockHydrateRemoteWorkspaceDetails.mockResolvedValue([ws] as any);

    const args = makeArgs({
      deletedWorkspaceIdsRef: { current: new Set(["ws-deleted"]) },
    });
    const { result } = renderHook(() => useWorkspaceSync(args));

    await act(async () => {
      await result.current.reloadWorkspaces();
    });

    // hydrateRemoteWorkspaceDetails should be called with empty array (filtered out)
    const hydrateCall = mockHydrateRemoteWorkspaceDetails.mock.calls[0];
    expect(hydrateCall[0]).toHaveLength(0);
  });

  test("initial fetch runs on mount when storage is hydrated", async () => {
    const args = makeArgs();
    renderHook(() => useWorkspaceSync(args));

    // Wait a tick for useEffect
    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });

    expect(mockApiGet).toHaveBeenCalledWith("/workspaces");
  });

  test("initial fetch skips when storage is not hydrated", async () => {
    const args = makeArgs({ storageHydrated: false });
    renderHook(() => useWorkspaceSync(args));

    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });

    expect(mockApiGet).not.toHaveBeenCalled();
  });

  test("sync skips when no auth token", async () => {
    mockGetAuthToken.mockReturnValue(null as any);
    const args = makeArgs({
      dirtyWorkspaceIdsRef: { current: new Set(["ws-1"]) },
    });
    renderHook(() => useWorkspaceSync(args));

    await act(async () => {
      await new Promise((r) => setTimeout(r, 2100));
    });

    expect(mockApiPut).not.toHaveBeenCalled();
  });

  test("reloadWorkspaces handles api errors gracefully", async () => {
    mockApiGet.mockRejectedValue(new Error("network error"));
    const args = makeArgs();
    const { result } = renderHook(() => useWorkspaceSync(args));

    await act(async () => {
      await expect(result.current.reloadWorkspaces()).resolves.toBeUndefined();
    });
  });
});
