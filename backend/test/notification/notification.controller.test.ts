import "reflect-metadata";

import { describe, expect, mock, test } from "bun:test";

import { NotificationController } from "../../src/notification/notification.controller.js";
import type { NotificationService } from "../../src/notification/notification.service.js";

describe("NotificationController", () => {
  const req = { authUser: { id: "user-1" } } as any;
  const realtime = { stream: () => ({}) } as any;

  test("list delegates with parsed query", async () => {
    const service = {
      listNotifications: mock(async () => [{ id: "n-1" }]),
    } as unknown as NotificationService;
    const controller = new NotificationController(service, realtime);

    const result = await controller.list(req as any, {
      tab: "direct",
      take: "10",
    });
    expect(result).toEqual([{ id: "n-1" }] as any);
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
    const controller = new NotificationController(service, realtime);

    await expect(
      controller.markAllRead(req as any, { tab: "watching" }),
    ).resolves.toEqual({ success: true, count: 2 });
    expect(service.markAllRead).toHaveBeenCalledWith("user-1", "watching");
  });

  test("counts delegates to notificationService.getCounts", async () => {
    const service = {
      getCounts: mock(async () => ({ direct: 1, watching: 2 })),
    } as unknown as NotificationService;
    const controller = new NotificationController(service, realtime);

    const result = await controller.counts(req as any);
    expect(result).toEqual({ direct: 1, watching: 2 } as any);
    expect(service.getCounts).toHaveBeenCalledWith("user-1");
  });

  test("events streams from realtime service", async () => {
    const realtimeService = {
      stream: mock(() => ({ data: "stream" })),
    } as any;
    const controller = new NotificationController({} as any, realtimeService);

    const result = controller.events(req as any);
    expect(result).toEqual({ data: "stream" } as any);
    expect(realtimeService.stream).toHaveBeenCalledWith("user-1");
  });

  test("preferences delegates to notificationService.getPreferences", async () => {
    const service = {
      getPreferences: mock(async () => [{ type: "test", enabled: true }]),
    } as unknown as NotificationService;
    const controller = new NotificationController(service, realtime);

    const result = await controller.preferences(req as any);
    expect(result).toEqual([{ type: "test", enabled: true }] as any);
    expect(service.getPreferences).toHaveBeenCalledWith("user-1");
  });

  test("updatePreference delegates to notificationService.updatePreference", async () => {
    const service = {
      updatePreference: mock(async () => ({ success: true })),
    } as unknown as NotificationService;
    const controller = new NotificationController(service, realtime);

    const body = { type: "test", channel: "email", enabled: false };
    const result = await controller.updatePreference(req as any, body);
    expect(result).toEqual({ success: true } as any);
    expect(service.updatePreference).toHaveBeenCalledWith("user-1", body);
  });

  test("markRead delegates to notificationService.markRead", async () => {
    const service = {
      markRead: mock(async () => ({ success: true })),
    } as unknown as NotificationService;
    const controller = new NotificationController(service, realtime);

    const result = await controller.markRead(req as any, "n-1", {
      isRead: true,
    });
    expect(result).toEqual({ success: true } as any);
    expect(service.markRead).toHaveBeenCalledWith("user-1", "n-1", true);
  });
});
