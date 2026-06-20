import { NotFoundException } from "@nestjs/common";
import { describe, expect, mock, test } from "bun:test";

import { NotificationService } from "../../src/notification/notification.service.js";
import { NotificationAudience } from "../../src/notification/notificationTypes.js";
import { createPrismaMock } from "../helpers/prismaMock";

describe("NotificationService", () => {
  test("lists direct notifications with user scope", async () => {
    let query: any;
    const service = new NotificationService(
      createPrismaMock({
        notification: {
          findMany: async (input: any) => {
            query = input;
            return [];
          },
        },
      }),
    );

    await service.listNotifications("user", "direct", 20);

    expect(query.where).toEqual({
      userId: "user",
      isArchived: false,
      audience: NotificationAudience.Direct,
    });
    expect(query.take).toBe(20);
  });

  test("counts unread tabs", async () => {
    const queries: any[] = [];
    const service = new NotificationService(
      createPrismaMock({
        notification: {
          count: async (input: any) => {
            queries.push(input.where);
            return queries.length;
          },
        },
      }),
    );

    await expect(service.getCounts("user")).resolves.toEqual({
      direct: 1,
      watching: 2,
      all: 3,
    });
    expect(queries[0].audience).toBe(NotificationAudience.Direct);
    expect(queries[1].audience).toBe(NotificationAudience.Watching);
    expect(queries[2].audience).toBeUndefined();
  });

  test("markRead only updates owned notification", async () => {
    let query: any;
    const service = new NotificationService(
      createPrismaMock({
        notification: {
          updateMany: async (input: any) => {
            query = input;
            return { count: 1 };
          },
        },
      }),
    );

    await expect(service.markRead("user", "notification")).resolves.toEqual({
      success: true,
    });
    expect(query.where).toEqual({ id: "notification", userId: "user" });
    expect(query.data.isRead).toBe(true);
  });

  test("markRead rejects missing notification", async () => {
    const service = new NotificationService(
      createPrismaMock({
        notification: { updateMany: async () => ({ count: 0 }) },
      }),
    );

    await expect(service.markRead("user", "missing")).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  test("createNotification creates notification and emits realtime event", async () => {
    let query: any;
    const realtimeService = { emit: mock(() => {}) } as any;
    const service = new NotificationService(
      createPrismaMock({
        notification: {
          create: async (input: any) => {
            query = input;
            return { id: "n-1" };
          },
        },
      }),
      realtimeService,
    );

    await service.createNotification({
      userId: "user-1",
      type: "TEST",
      message: "hello",
    } as any);

    expect(query.data.userId).toBe("user-1");
    expect(query.data.audience).toBe(NotificationAudience.All);
    expect(realtimeService.emit).toHaveBeenCalledWith("user-1");
  });

  test("createNotifications creates multiple notifications and emits to distinct users", async () => {
    let query: any;
    const realtimeService = { emit: mock(() => {}) } as any;
    const service = new NotificationService(
      createPrismaMock({
        notification: {
          createMany: async (input: any) => {
            query = input;
            return { count: 2 };
          },
        },
      }),
      realtimeService,
    );

    const result = await service.createNotifications([
      { userId: "user-1", type: "TEST" } as any,
      { userId: "user-2", type: "TEST" } as any,
      { userId: "user-1", type: "TEST" } as any,
    ]);

    expect(result.count).toBe(2);
    expect(query.data.length).toBe(3);
    expect(realtimeService.emit).toHaveBeenCalledTimes(2);
    expect(realtimeService.emit).toHaveBeenCalledWith("user-1");
    expect(realtimeService.emit).toHaveBeenCalledWith("user-2");
  });

  test("createNotifications returns 0 when no inputs provided", async () => {
    const service = new NotificationService(createPrismaMock({}));
    const result = await service.createNotifications([]);
    expect(result).toEqual({ count: 0 });
  });

  test("markAllRead updates unread notifications in tab and emits event", async () => {
    let query: any;
    const realtimeService = { emit: mock(() => {}) } as any;
    const service = new NotificationService(
      createPrismaMock({
        notification: {
          updateMany: async (input: any) => {
            query = input;
            return { count: 5 };
          },
        },
      }),
      realtimeService,
    );

    const result = await service.markAllRead("user", "watching");

    expect(result).toEqual({ success: true, count: 5 });
    expect(query.where.userId).toBe("user");
    expect(query.where.isRead).toBe(false);
    expect(query.where.audience).toBe(NotificationAudience.Watching);
    expect(query.data.isRead).toBe(true);
    expect(realtimeService.emit).toHaveBeenCalledWith("user");
  });

  test("getPreferences returns preferences for user", async () => {
    const service = new NotificationService(
      createPrismaMock({
        notificationPreference: {
          findMany: async () => [{ type: "email" }],
        },
      }),
    );

    const result = await service.getPreferences("user");
    expect(result).toEqual([{ type: "email" }] as any);
  });

  test("updatePreference upserts preference with default channel IN_APP", async () => {
    let query: any;
    const service = new NotificationService(
      createPrismaMock({
        notificationPreference: {
          upsert: async (input: any) => {
            query = input;
            return { success: true };
          },
        },
      }),
    );

    await service.updatePreference("user", { type: "test", enabled: false });

    expect(query.where.userId_type_channel).toEqual({
      userId: "user",
      type: "test",
      channel: "IN_APP",
    });
    expect(query.update.enabled).toBe(false);
    expect(query.create.enabled).toBe(false);
    expect(query.create.channel).toBe("IN_APP");
  });
});
