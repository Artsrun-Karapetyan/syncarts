import { describe, expect, mock, test } from "bun:test";

const mockApiDelete = mock(() => Promise.resolve({ data: {} }));
mock.module("@/lib/api", () => ({
  api: {
    delete: mockApiDelete,
  },
}));

const mockGetAuthToken = mock(() => null);
mock.module("@/lib/auth", () => ({
  getAuthToken: mockGetAuthToken,
}));

import { useWorkspaceCrudActions } from "./useWorkspaceCrudActions";

describe("useWorkspaceCrudActions", () => {
  const defaultArgs = () => ({
    activeWorkspaceId: "ws-1",
    deletedWorkspaceIdsRef: { current: new Set<string>() },
    dirtyWorkspaceIdsRef: { current: new Set<string>() },
    lastSyncedSignaturesRef: { current: {} },
    localDefaultWorkspaceId: "ws-default",
    setActiveEnvIdByWorkspace: mock(),
    setActiveTabIdByWorkspace: mock(),
    setActiveWorkspaceId: mock(),
    setTabsByWorkspace: mock(),
    setWorkspaces: mock(),
    syncingWorkspaceIdsRef: { current: new Set<string>() },
    userId: "user-1",
    workspaces: [
      { id: "ws-default", name: "Default" },
      { id: "ws-1", name: "Work 1" },
    ] as any[],
  });

  test("createWorkspace sets correct state and calls setWorkspaces", () => {
    const args = defaultArgs();
    const actions = useWorkspaceCrudActions(args);
    const newId = actions.createWorkspace("New Workspace");

    expect(newId).toBeDefined();
    expect(args.dirtyWorkspaceIdsRef.current.has(newId)).toBe(true);
    expect(args.setWorkspaces).toHaveBeenCalled();
    expect(args.setTabsByWorkspace).toHaveBeenCalled();
    expect(args.setActiveTabIdByWorkspace).toHaveBeenCalled();
    expect(args.setActiveWorkspaceId).toHaveBeenCalledWith(newId);
  });

  test("switchWorkspace triggers setActiveWorkspaceId", () => {
    const args = defaultArgs();
    const actions = useWorkspaceCrudActions(args);
    actions.switchWorkspace("ws-new");
    expect(args.setActiveWorkspaceId).toHaveBeenCalledWith("ws-new");
  });

  test("renameWorkspace updates workspace name and marks dirty", () => {
    const args = defaultArgs();
    const actions = useWorkspaceCrudActions(args);
    actions.renameWorkspace("ws-1", "Renamed Workspace");

    expect(args.dirtyWorkspaceIdsRef.current.has("ws-1")).toBe(true);
    expect(args.setWorkspaces).toHaveBeenCalled();
  });

  test("renameWorkspace throws on default workspace", () => {
    const args = defaultArgs();
    const actions = useWorkspaceCrudActions(args);
    expect(() => actions.renameWorkspace("ws-default", "Bad")).toThrow();
  });

  test("removeWorkspace throws on default workspace", async () => {
    const args = defaultArgs();
    const actions = useWorkspaceCrudActions(args);
    await expect(actions.removeWorkspace("ws-default")).rejects.toThrow();
  });

  test("removeWorkspace deletes local workspace and switches workspace", async () => {
    const args = defaultArgs();
    const actions = useWorkspaceCrudActions(args);

    // Simulate removing "ws-1" (non-default workspace)
    await actions.removeWorkspace("ws-1");

    expect(args.deletedWorkspaceIdsRef.current.has("ws-1")).toBe(true);
    expect(args.setWorkspaces).toHaveBeenCalled();
    expect(args.setActiveWorkspaceId).toHaveBeenCalledWith("ws-default");
  });
});
