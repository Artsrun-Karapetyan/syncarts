import "reflect-metadata";

import { describe, expect, mock, test } from "bun:test";

import { NotificationController } from "../../src/notification/notification.controller.js";
import type { NotificationService } from "../../src/notification/notification.service.js";

describe("NotificationController", () => {
  const req = { authUser: { id: "user-1" } };

  test("list delegates with parsed query", async () => {
    const service = {
      listNotifications: mock(async () => [{ id: "n-1" }]),
    } as unknown as NotificationService;
    const controller = new NotificationController(service);

    await expect(
      controller.list(req as any, { tab: "direct", take: "10" }),
    ).resolves.toEqual([{ id: "n-1" }]);
    expect(service.listNotifications).toHaveBeenCalledWith(
      "user-1",
      "direct",
      10,
    );
  });

  test("markAllRead delegates with user scope", async () => {
    const service = {
      markAllRead: mock(async () => ({ success: true, count: 2 })),
    } as unknown as NotificationService;
    const controller = new NotificationController(service);

    await expect(
      controller.markAllRead(req as any, { tab: "watching" }),
    ).resolves.toEqual({ success: true, count: 2 });
    expect(service.markAllRead).toHaveBeenCalledWith("user-1", "watching");
  });
});
