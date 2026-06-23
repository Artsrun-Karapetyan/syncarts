import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, mock, test } from "bun:test";
import React from "react";

const mockUseWorkspaceGit = mock(() => ({
  isSyncing: false,
  syncStatus: null as any,
  pullChanges: mock(),
  pushChanges: mock(),
  refreshSyncStatus: mock(),
}));

mock.module("@/contexts/workspace/git/useWorkspaceGit", () => ({
  useWorkspaceGit: mockUseWorkspaceGit,
}));

import { GitSyncButton } from "./GitSyncButton";

describe("GitSyncButton", () => {
  test("returns null if syncStatus is missing", () => {
    mockUseWorkspaceGit.mockReturnValue({
      isSyncing: false,
      syncStatus: null,
      pullChanges: mock(),
      pushChanges: mock(),
      refreshSyncStatus: mock(),
    });
    const { container } = render(<GitSyncButton />);
    expect(container.firstChild).toBeNull();
  });

  test("renders pull button when behind", () => {
    const pullChanges = mock();
    mockUseWorkspaceGit.mockReturnValue({
      isSyncing: false,
      syncStatus: { ahead: 0, behind: 2, upstream: "origin/main" },
      pullChanges,
      pushChanges: mock(),
      refreshSyncStatus: mock(),
    });

    render(<GitSyncButton />);
    const btn = screen.getByRole("button");
    expect(btn.textContent).toContain("2"); // behind count
    fireEvent.click(btn);
    expect(pullChanges).toHaveBeenCalled();
  });

  test("renders push button when ahead", () => {
    const pushChanges = mock();
    mockUseWorkspaceGit.mockReturnValue({
      isSyncing: false,
      syncStatus: { ahead: 3, behind: 0, upstream: "origin/main" },
      pullChanges: mock(),
      pushChanges,
      refreshSyncStatus: mock(),
    });

    render(<GitSyncButton />);
    const btn = screen.getByRole("button");
    expect(btn.textContent).toContain("3"); // ahead count
    fireEvent.click(btn);
    expect(pushChanges).toHaveBeenCalled();
  });

  test("renders refresh button when in sync", () => {
    const refreshSyncStatus = mock();
    mockUseWorkspaceGit.mockReturnValue({
      isSyncing: false,
      syncStatus: { ahead: 0, behind: 0, upstream: "origin/main" },
      pullChanges: mock(),
      pushChanges: mock(),
      refreshSyncStatus,
    });

    render(<GitSyncButton />);
    const btn = screen.getByTitle("Refresh Sync Status");
    expect(btn).toBeTruthy();
    fireEvent.click(btn);
    expect(refreshSyncStatus).toHaveBeenCalled();
  });

  test("does not trigger actions when isSyncing is true", () => {
    const pullChanges = mock();
    mockUseWorkspaceGit.mockReturnValue({
      isSyncing: true,
      syncStatus: { ahead: 0, behind: 2, upstream: "origin/main" },
      pullChanges,
      pushChanges: mock(),
      refreshSyncStatus: mock(),
    });

    render(<GitSyncButton />);
    const btn = screen.getByRole("button");
    fireEvent.click(btn);
    expect(pullChanges).not.toHaveBeenCalled();
  });
});
