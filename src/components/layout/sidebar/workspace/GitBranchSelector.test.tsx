import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, mock, test } from "bun:test";

const mockUseWorkspaceGit = {
  isGitRepo: true,
  currentBranch: "main" as string | null,
  branches: [
    { name: "main", is_remote: false },
    { name: "feature", is_remote: false },
    { name: "bugfix", is_remote: true },
  ],
  isLoading: false,
  isCheckingOut: false,
  error: null as string | null,
  checkoutBranch: mock(),
  refresh: mock(),
};

mock.module("@/contexts/workspace/git/WorkspaceGitContext", () => ({
  useWorkspaceGitContext: () => mockUseWorkspaceGit,
}));

import { GitBranchSelector } from "./GitBranchSelector";

describe("GitBranchSelector", () => {
  test("renders nothing if not a git repo", () => {
    mockUseWorkspaceGit.isGitRepo = false;
    const { container } = render(<GitBranchSelector />);
    expect(container.firstChild).toBeNull();
    mockUseWorkspaceGit.isGitRepo = true; // reset
  });

  test("renders branch selector with current branch", () => {
    render(<GitBranchSelector />);
    expect(screen.getByText("main")).toBeDefined();
  });

  test("renders loading state", () => {
    mockUseWorkspaceGit.isLoading = true;
    mockUseWorkspaceGit.currentBranch = null;
    mockUseWorkspaceGit.branches = [];
    render(<GitBranchSelector />);
    // With no current branch the button falls back to the placeholder label
    expect(screen.getByText("Select Branch")).toBeDefined();
    mockUseWorkspaceGit.isLoading = false; // reset
    mockUseWorkspaceGit.currentBranch = "main"; // reset
    mockUseWorkspaceGit.branches = [
      { name: "main", is_remote: false },
      { name: "feature", is_remote: false },
      { name: "bugfix", is_remote: true },
    ]; // reset
  });

  test("renders error message if there is an error inside popover", () => {
    mockUseWorkspaceGit.error = "Failed to checkout";
    render(<GitBranchSelector />);
    // Error is only visible when popover is open
    fireEvent.click(screen.getByText("main"));
    expect(screen.getByText("Failed to checkout")).toBeDefined();
    mockUseWorkspaceGit.error = null; // reset
  });
});
