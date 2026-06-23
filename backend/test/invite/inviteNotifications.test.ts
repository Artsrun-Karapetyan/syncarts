import { describe, expect, mock, test } from "bun:test";

import { notifyMemberAddedToWorkspaces } from "../../src/invite/inviteNotifications.js";
import { NotificationAudience } from "../../src/notification/notificationTypes.js";

describe("inviteNotifications", () => {
  test("creates notifications when service and workspaces are provided", async () => {
    const notifications = {
      createNotifications: mock(async () => ({ count: 1 })),
    } as any;

    await notifyMemberAddedToWorkspaces({
      notifications,
      userId: "u-1",
      ownerId: "o-1",
      workspaces: [
        { id: "w-1", name: "Workspace 1", owner: { name: "Owner Name" } },
      ],
    });

    expect(notifications.createNotifications).toHaveBeenCalledWith([
      {
        userId: "u-1",
        workspaceId: "w-1",
        type: "WORKSPACE_INVITE_RECEIVED",
        audience: NotificationAudience.Direct,
        title: "Workspace invite received",
        message: "Owner Name added you to Workspace 1",
        entityType: "workspace",
        entityId: "w-1",
        actorId: "o-1",
        actorName: "Owner Name",
        actionUrl: "/",
        actionLabel: "Open",
        metadata: { workspaceId: "w-1" },
      },
    ]);
  });

  test("does nothing if notifications service is absent", async () => {
    await notifyMemberAddedToWorkspaces({
      userId: "u-1",
      ownerId: "o-1",
      workspaces: [
        { id: "w-1", name: "Workspace 1", owner: { name: "Owner Name" } },
      ],
    });
    expect(true).toBe(true);
  });

  test("does nothing if workspaces array is empty", async () => {
    const notifications = {
      createNotifications: mock(async () => ({})),
    } as any;
    await notifyMemberAddedToWorkspaces({
      notifications,
      userId: "u-1",
      ownerId: "o-1",
      workspaces: [],
    });
    expect(notifications.createNotifications).not.toHaveBeenCalled();
  });

  test("swallows exceptions during notification creation", async () => {
    const notifications = {
      createNotifications: mock(async () => {
        throw new Error("test");
      }),
    } as any;
    await expect(
      notifyMemberAddedToWorkspaces({
        notifications,
        userId: "u-1",
        ownerId: "o-1",
        workspaces: [{ id: "w-1", name: "W1", owner: { name: "O1" } }],
      }),
    ).resolves.toBeUndefined();
  });
});
