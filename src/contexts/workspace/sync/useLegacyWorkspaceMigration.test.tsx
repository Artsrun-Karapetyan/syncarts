import { renderHook } from "@testing-library/react";
import { describe, expect, mock, test } from "bun:test";

import { useLegacyWorkspaceMigration } from "./useLegacyWorkspaceMigration";

describe("useLegacyWorkspaceMigration", () => {
  const defaultArgs = () => {
    const workspaces = [
      { id: "default", name: "Default WS", ownerId: "user-123" },
    ] as any[];
    const setWorkspaces = mock((updater: any) => {
      const res = updater(workspaces);
      workspaces.splice(0, workspaces.length, ...res);
    });

    return {
      activeWorkspaceId: "default",
      localDefaultWorkspaceId: "local-user-123",
      storageHydrated: true,
      userId: "user-123",
      setActiveWorkspaceId: mock(),
      setActiveEnvIdByWorkspace: mock(),
      setActiveTabIdByWorkspace: mock(),
      setTabsByWorkspace: mock(),
      setWorkspaces,
      workspaces,
    };
  };

  test("does nothing if storage is not hydrated", () => {
    const args = defaultArgs();
    args.storageHydrated = false;
    renderHook(() => useLegacyWorkspaceMigration(args));

    expect(args.setWorkspaces).not.toHaveBeenCalled();
  });

  test("migrates default workspace to localDefaultWorkspaceId when hydrated", () => {
    const args = defaultArgs();
    renderHook(() => useLegacyWorkspaceMigration(args));

    expect(args.setWorkspaces).toHaveBeenCalled();
    expect(args.workspaces[0].id).toBe("local-user-123");
    expect(args.setActiveWorkspaceId).toHaveBeenCalledWith("local-user-123");
  });
});
