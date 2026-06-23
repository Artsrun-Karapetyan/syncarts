import { describe, expect, mock, test } from "bun:test";

import { WatchService } from "../../src/watch/watch.service.js";
import { WatchEntityTypes } from "../../src/watch/watchTypes.js";
import { createPrismaMock } from "../helpers/prismaMock";

describe("WatchService", () => {
  const notificationService = {
    createNotifications: mock(async (input: any[]) => ({
      count: input.length,
    })),
  };

  test("lists watches with workspace access", async () => {
    let query: any;
    const service = new WatchService(
      createPrismaMock({
        workspace: { findFirst: async () => ({ id: "ws" }) },
        workspaceWatch: {
          findMany: async (input: any) => {
            query = input;
            return [];
          },
        },
      }),
      notificationService as any,
    );

    await service.listWatches("user", "ws");

    expect(query.where).toEqual({ userId: "user", workspaceId: "ws" });
  });

  test("setWatch upserts when enabled", async () => {
    let upsertInput: any;
    const service = new WatchService(
      createPrismaMock({
        workspace: { findFirst: async () => ({ id: "ws" }) },
        workspaceWatch: {
          upsert: async (input: any) => {
            upsertInput = input;
            return input.create;
          },
        },
      }),
      notificationService as any,
    );

    await service.setWatch(
      "user",
      {
        workspaceId: "ws",
        entityType: WatchEntityTypes.Collection,
        entityId: "col",
      },
      true,
    );

    expect(upsertInput.create).toMatchObject({
      userId: "user",
      workspaceId: "ws",
      entityType: "collection",
      entityId: "col",
    });
  });

  test("setWatch strips enabled before Prisma writes", async () => {
    let upsertInput: any;
    const service = new WatchService(
      createPrismaMock({
        workspace: { findFirst: async () => ({ id: "ws" }) },
        workspaceWatch: {
          upsert: async (input: any) => {
            upsertInput = input;
            return input.create;
          },
        },
      }),
      notificationService as any,
    );

    await service.setWatch(
      "user",
      {
        workspaceId: "ws",
        entityType: WatchEntityTypes.Collection,
        entityId: "col",
        enabled: true,
      } as any,
      true,
    );

    expect(upsertInput.create.enabled).toBeUndefined();
    expect(
      upsertInput.where.userId_workspaceId_entityType_entityId.enabled,
    ).toBeUndefined();
  });

  test("notifyWatchers deduplicates workspace and entity watches", async () => {
    const calls: any[] = [];
    const service = new WatchService(
      createPrismaMock({
        workspaceWatch: {
          findMany: async () => [{ userId: "u1" }, { userId: "u1" }],
        },
      }),
      {
        createNotifications: async (input: any[]) => {
          calls.push(input);
          return { count: input.length };
        },
      } as any,
    );

    await service.notifyWatchers({
      workspaceId: "ws",
      actorId: "actor",
      entityType: WatchEntityTypes.Request,
      entityId: "req",
      collectionId: "col",
      type: "WATCHED_REQUEST_UPDATED",
      title: "Updated",
      message: "Request updated",
    });

    expect(calls[0]).toHaveLength(1);
    expect(calls[0][0].audience).toBe("WATCHING");
  });
});
