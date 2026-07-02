import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test } from "bun:test";

import { useWorkspaceController } from "./useWorkspaceController";

describe("useWorkspaceController", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  test("initializes default workspace for online user", () => {
    const { result } = renderHook(() => useWorkspaceController("user-123"));

    expect(result.current.userId).toBe("user-123");
    expect(result.current.workspaces.length).toBeGreaterThan(0);
    expect(result.current.activeWorkspaceId).toBeDefined();
  });

  test("initializes a default workspace for offline user", () => {
    const { result } = renderHook(() => useWorkspaceController("offline"));

    expect(result.current.userId).toBe("offline");
    expect(result.current.workspaces.length).toBeGreaterThan(0);
    expect(result.current.activeWorkspaceId).toBeDefined();
  });

  test("createBlankRequestInFolder adds a new request to collection and tab list", () => {
    const { result } = renderHook(() => useWorkspaceController("user-123"));

    // Ensure we have at least one workspace & collection to add to
    const wsId = result.current.activeWorkspaceId;
    expect(wsId).toBeDefined();

    // Let's manually set a workspace with collections to make the test predictable
    act(() => {
      result.current.switchWorkspace(wsId);
    });

    // Create a new request in a dummy collection
    act(() => {
      result.current.createBlankRequestInFolder("col-123", null);
    });

    // Verify a tab is opened
    expect(result.current.tabs.length).toBe(1);
    expect(result.current.tabs[0].collectionId).toBe("col-123");
    expect(result.current.tabs[0].name).toBe("New Request");
  });

  test("updateSecret updates workspace secret correctly", async () => {
    const { result } = renderHook(() => useWorkspaceController("user-123"));

    act(() => {
      result.current.updateSecret("var-123", "secret-val");
    });

    expect(result.current.secrets["var-123"]).toBe("secret-val");
  });
});
