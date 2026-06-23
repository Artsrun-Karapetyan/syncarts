import { act, renderHook } from "@testing-library/react";
import { describe, expect, mock, test } from "bun:test";

const mockGet = mock(() =>
  Promise.resolve({ data: { id: "req-1", name: "Updated Req" } }),
);
mock.module("@/lib/api", () => ({
  api: {
    get: mockGet,
  },
}));

class MockEventSource {
  listeners: Record<string, Function[]> = {};
  closed = false;

  addEventListener(type: string, listener: Function) {
    if (!this.listeners[type]) this.listeners[type] = [];
    this.listeners[type].push(listener);
  }

  removeEventListener(type: string, listener: Function) {
    if (this.listeners[type]) {
      this.listeners[type] = this.listeners[type].filter((l) => l !== listener);
    }
  }

  close() {
    this.closed = true;
  }

  emit(type: string, data: any) {
    const event = { data: JSON.stringify(data) };
    this.listeners[type]?.forEach((l) => l(event));
  }
}

let currentMockEventSource: MockEventSource | null = null;

mock.module("./workspaceRealtimeHelpers", () => ({
  createWorkspaceEventSource: () => {
    currentMockEventSource = new MockEventSource();
    return currentMockEventSource;
  },
  replaceRealtimeRequest: (workspaces: any[]) => ({
    changed: true,
    needsReload: false,
    workspaces,
  }),
}));

import { useWorkspaceRealtime } from "./useWorkspaceRealtime";

describe("useWorkspaceRealtime", () => {
  const defaultArgs = () => {
    const workspaces = [
      { id: "ws-1", name: "WS 1", ownerId: "user-123", collections: [] },
    ];
    return {
      activeWorkspaceId: "ws-1",
      dirtyWorkspaceIdsRef: { current: new Set<string>() },
      reloadWorkspaces: mock(() => Promise.resolve()),
      setWorkspaces: mock(),
      storageHydrated: true,
      syncingWorkspaceIdsRef: { current: new Set<string>() },
      workspacesRef: { current: workspaces },
    };
  };

  test("connects to EventSource, listens to update events and closes on unmount", async () => {
    const args = defaultArgs();
    const { unmount } = renderHook(() => useWorkspaceRealtime(args));

    expect(currentMockEventSource).not.toBeNull();
    expect(currentMockEventSource?.closed).toBe(false);

    // Emit workspace.updated event
    act(() => {
      currentMockEventSource?.emit("workspace.updated", {
        workspaceId: "ws-1",
      });
    });
    expect(args.reloadWorkspaces).toHaveBeenCalled();

    // Emit request.updated event
    act(() => {
      currentMockEventSource?.emit("request.updated", {
        workspaceId: "ws-1",
        entityId: "req-1",
      });
    });
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(mockGet).toHaveBeenCalledWith("/workspaces/ws-1/requests/req-1");

    unmount();
    expect(currentMockEventSource?.closed).toBe(true);
  });
});
