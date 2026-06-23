import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, mock, test } from "bun:test";

const mockInvoke = mock();
mock.module("@tauri-apps/api/core", () => ({ invoke: mockInvoke }));

const mockUseWorkspace = {
  activeWorkspaceId: "w1",
  workspaces: [{ id: "w1", type: "local", path: "/mock/path" }],
};

mock.module("@/contexts/WorkspaceContext", () => ({
  useWorkspace: () => mockUseWorkspace,
}));

import { useWorkspaceGit } from "./useWorkspaceGit";

describe("useWorkspaceGit", () => {
  test("returns default empty state if not local workspace", async () => {
    mockUseWorkspace.workspaces[0].type = "cloud" as any;
    const { result } = renderHook(() => useWorkspaceGit(undefined));

    expect(result.current.isGitRepo).toBe(false);
    expect(result.current.currentBranch).toBeNull();
    expect(result.current.branches).toEqual([]);

    // reset for other tests
    mockUseWorkspace.workspaces[0].type = "local" as any;
  });

  test("fetches git state successfully", async () => {
    mockInvoke.mockImplementation(async (cmd: string) => {
      if (cmd === "git_check_repo") return true;
      if (cmd === "git_get_current_branch") return "main";
      if (cmd === "git_get_branches")
        return [
          { name: "main", is_remote: false },
          { name: "feature", is_remote: false },
        ];
      if (cmd === "git_get_sync_status")
        return { ahead: 1, behind: 2, upstream: "origin/main" };
      return null;
    });

    const { result } = renderHook(() => useWorkspaceGit("/mock/path"));

    // wait for async fetch
    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });

    expect(mockInvoke).toHaveBeenCalledWith("git_check_repo", {
      path: "/mock/path",
    });
    await waitFor(() => {
      expect(result.current.isGitRepo).toBe(true);
      expect(result.current.currentBranch).toBe("main");
      expect(result.current.branches).toEqual([
        { name: "main", is_remote: false },
        { name: "feature", is_remote: false },
      ]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.syncStatus).toEqual({
        ahead: 1,
        behind: 2,
        upstream: "origin/main",
      });
    });
  });

  test("checkoutBranch calls Tauri invoke and refreshes", async () => {
    mockInvoke.mockImplementation(async (cmd, _args) => {
      if (cmd === "git_check_repo") return true;
      if (cmd === "git_get_current_branch") return "feature";
      if (cmd === "git_get_branches")
        return [
          { name: "main", is_remote: false },
          { name: "feature", is_remote: false },
        ];
      if (cmd === "git_checkout_branch") return true;
      return null;
    });

    const { result } = renderHook(() => useWorkspaceGit("/mock/path"));

    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });

    expect(result.current.currentBranch).toBe("feature");

    let checkoutResult: boolean | undefined;
    await act(async () => {
      checkoutResult = await result.current.checkoutBranch("main");
    });

    expect(checkoutResult).toBe(true);
    expect(mockInvoke).toHaveBeenCalledWith("git_checkout_branch", {
      path: "/mock/path",
      branch: "main",
    });
  });

  test("pullChanges and pushChanges call correct invoke methods", async () => {
    mockInvoke.mockImplementation(async (cmd) => {
      if (cmd === "git_check_repo") return true;
      if (cmd === "git_pull") return true;
      if (cmd === "git_push") return true;
      if (cmd === "git_get_sync_status")
        return { ahead: 0, behind: 0, upstream: "origin/main" };
      return [];
    });

    const { result } = renderHook(() => useWorkspaceGit("/mock/path"));
    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });

    let pullResult: boolean | undefined;
    await act(async () => {
      pullResult = await result.current.pullChanges();
    });
    expect(pullResult).toBe(true);
    expect(mockInvoke).toHaveBeenCalledWith("git_pull", { path: "/mock/path" });

    let pushResult: boolean | undefined;
    await act(async () => {
      pushResult = await result.current.pushChanges();
    });
    expect(pushResult).toBe(true);
    expect(mockInvoke).toHaveBeenCalledWith("git_push", { path: "/mock/path" });
  });
});
