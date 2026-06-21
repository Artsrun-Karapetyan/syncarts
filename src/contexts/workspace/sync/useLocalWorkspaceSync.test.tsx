import { renderHook } from "@testing-library/react";
import { describe, expect, mock, test } from "bun:test";

const mockInvoke = mock(() => Promise.resolve());
const mockListen = mock(() => Promise.resolve(() => {}));
mock.module("@tauri-apps/api/core", () => ({
  invoke: mockInvoke,
}));
mock.module("@tauri-apps/api/event", () => ({
  listen: mockListen,
}));

const mockRead = mock(() =>
  Promise.resolve({
    id: "ws-local",
    name: "Fs WS",
    type: "local",
    path: "/path",
  }),
);
const mockWrite = mock(() => Promise.resolve());
mock.module("./localFsSyncHelpers", () => ({
  readWorkspaceFromLocalFs: mockRead,
  writeWorkspaceToLocalFs: mockWrite,
}));

import { useLocalWorkspaceSync } from "./useLocalWorkspaceSync";

describe("useLocalWorkspaceSync", () => {
  const defaultArgs = () => {
    const workspaces = [
      {
        id: "ws-local",
        name: "Local WS",
        type: "local" as const,
        path: "/path",
        collections: [],
      },
    ];
    return {
      activeWorkspaceId: "ws-local",
      deletedWorkspaceIdsRef: { current: new Set<string>() },
      dirtyWorkspaceIdsRef: { current: new Set<string>(["ws-local"]) },
      setWorkspaces: mock(),
      storageHydrated: true,
      workspaces,
    };
  };

  test("reads workspace from local FS and watches on mount", async () => {
    const args = defaultArgs();
    renderHook(() => useLocalWorkspaceSync(args));

    // Wait a tick for the async call
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(mockRead).toHaveBeenCalledWith("/path");
    expect(mockInvoke).toHaveBeenCalledWith("watch_local_workspace", {
      path: "/path",
    });
  });

  test("writes workspace changes when dirty", async () => {
    const args = defaultArgs();
    renderHook(() => useLocalWorkspaceSync(args));

    // Wait 1.1s for the 1000ms debounce
    await new Promise((resolve) => setTimeout(resolve, 1100));

    expect(mockWrite).toHaveBeenCalled();
  });
});
