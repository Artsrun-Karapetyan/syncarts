import { render, screen } from "@testing-library/react";
import { describe, expect, mock, test } from "bun:test";

let mockActiveWorkspaceId = "w1";
let switchWorkspaceCalled: any = null;
let openCollectionTabCalled: any = null;
let openRequestTabCalled: any[] = [];

mock.module("@/contexts/WorkspaceContext", () => ({
  useWorkspace: () => ({
    activeWorkspaceId: mockActiveWorkspaceId,
    switchWorkspace: (id: string) => {
      switchWorkspaceCalled = id;
    },
    openCollectionTab: (id: string) => {
      openCollectionTabCalled = id;
    },
    openRequestTab: (colId: string, folderId: string | null, reqId: string) => {
      openRequestTabCalled = [colId, folderId, reqId];
    },
  }),
}));

import { useNotificationAction } from "./useNotificationAction";

function TestConsumer({ notification }: { notification: any }) {
  const { openNotificationTarget } = useNotificationAction();

  return (
    <button
      data-testid="btn"
      onClick={() => openNotificationTarget(notification)}
    >
      Click
    </button>
  );
}

describe("useNotificationAction", () => {
  test("returns false when target cannot be determined", () => {
    render(<TestConsumer notification={{ entityType: "unknown" } as any} />);
    const btn = screen.getByTestId("btn");
    btn.click();
    expect(switchWorkspaceCalled).toBeNull();
  });

  test("switches workspace if notification target workspace does not match current", () => {
    switchWorkspaceCalled = null;
    mockActiveWorkspaceId = "w1";
    const notification = {
      entityType: "workspace",
      workspaceId: "w2",
    };

    render(<TestConsumer notification={notification} />);
    screen.getByTestId("btn").click();

    expect(switchWorkspaceCalled).toBe("w2");
  });

  test("opens collection tab if current workspace matches target", () => {
    openCollectionTabCalled = null;
    mockActiveWorkspaceId = "w1";
    const notification = {
      entityType: "collection",
      entityId: "col123",
      workspaceId: "w1",
    };

    render(<TestConsumer notification={notification} />);
    screen.getByTestId("btn").click();

    expect(openCollectionTabCalled).toBe("col123");
  });

  test("opens request tab if current workspace matches target", () => {
    openRequestTabCalled = [];
    mockActiveWorkspaceId = "w1";
    const notification = {
      entityType: "request",
      entityId: "req123",
      workspaceId: "w1",
      metadata: {
        collectionId: "col123",
      },
    };

    render(<TestConsumer notification={notification} />);
    screen.getByTestId("btn").click();

    expect(openRequestTabCalled).toEqual(["col123", null, "req123"]);
  });
});
