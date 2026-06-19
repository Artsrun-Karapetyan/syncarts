import { NotFoundException } from "@nestjs/common";
import { describe, expect, test } from "bun:test";

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
});
