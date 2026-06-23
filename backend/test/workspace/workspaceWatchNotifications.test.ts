import { describe, expect, mock, test } from "bun:test";

import { WatchEntityTypes } from "../../src/watch/watchTypes.js";
import { notifyWorkspaceWatchers } from "../../src/workspace/workspaceWatchNotifications.js";

describe("workspaceWatchNotifications", () => {
  test("notifies watchers when service is provided", async () => {
    const watches = { notifyWatchers: mock(async () => ({})) } as any;
    await notifyWorkspaceWatchers({
      watches,
      workspaceId: "w-1",
      userId: "u-1",
    });

    expect(watches.notifyWatchers).toHaveBeenCalledWith({
      workspaceId: "w-1",
      actorId: "u-1",
      entityType: WatchEntityTypes.Workspace,
      entityId: "w-1",
      type: "WATCHED_WORKSPACE_UPDATED",
      title: "Watched workspace updated",
      message: "Workspace data was synced",
      actionUrl: "/",
      metadata: { workspaceId: "w-1" },
    });
  });

  test("does nothing if watch service is absent", async () => {
    await notifyWorkspaceWatchers({
      workspaceId: "w-1",
      userId: "u-1",
    });
    expect(true).toBe(true);
  });

  test("swallows exceptions during notification", async () => {
    const watches = {
      notifyWatchers: mock(async () => {
        throw new Error("test error");
      }),
    } as any;
    await expect(
      notifyWorkspaceWatchers({
        watches,
        workspaceId: "w-1",
        userId: "u-1",
      }),
    ).resolves.toBeUndefined();
  });
});
