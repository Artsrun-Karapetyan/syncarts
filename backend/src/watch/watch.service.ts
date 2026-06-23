import { Inject, Injectable } from "@nestjs/common";

import { NotificationService } from "../notification/notification.service.js";
import { NotificationAudience } from "../notification/notificationTypes.js";
import { PrismaService } from "../prisma/prisma.service.js";
import { getWorkspaceAccess } from "../workspace/workspaceAccess.js";
import {
  WatchEntityTypes,
  type WatchInput,
  type WatchNotificationInput,
} from "./watchTypes.js";

@Injectable()
export class WatchService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(NotificationService)
    private readonly notifications: NotificationService,
  ) {}

  async listWatches(userId: string, workspaceId: string) {
    await getWorkspaceAccess(this.prisma, workspaceId, userId);
    return this.prisma.workspaceWatch.findMany({
      where: { userId, workspaceId },
      orderBy: { createdAt: "desc" },
    });
  }

  async setWatch(userId: string, input: WatchInput, enabled: boolean) {
    const watchInput = normalizeWatchInput(input);
    await getWorkspaceAccess(this.prisma, watchInput.workspaceId, userId);

    if (!enabled) {
      await this.prisma.workspaceWatch.deleteMany({
        where: { userId, ...watchInput },
      });
      return { enabled: false, ...watchInput };
    }

    await this.prisma.workspaceWatch.upsert({
      where: {
        userId_workspaceId_entityType_entityId: { userId, ...watchInput },
      },
      update: {},
      create: { userId, ...watchInput },
    });
    return { enabled: true, ...watchInput };
  }

  async notifyWatchers(input: WatchNotificationInput) {
    const watches = await this.prisma.workspaceWatch.findMany({
      where: {
        workspaceId: input.workspaceId,
        userId: { not: input.actorId },
        OR: this.buildWatchTargets(input),
      },
      select: { userId: true },
    });
    const userIds = Array.from(new Set(watches.map((watch) => watch.userId)));
    if (userIds.length === 0) return { count: 0 };

    return this.notifications.createNotifications(
      userIds.map((userId) => ({
        userId,
        workspaceId: input.workspaceId,
        type: input.type,
        audience: NotificationAudience.Watching,
        title: input.title,
        message: input.message,
        entityType: input.entityType,
        entityId: input.entityId,
        actorId: input.actorId,
        actionUrl: input.actionUrl || "/",
        actionLabel: "Open",
        metadata: input.metadata,
      })),
    );
  }

  private buildWatchTargets(input: WatchNotificationInput) {
    return [
      {
        entityType: WatchEntityTypes.Workspace,
        entityId: input.workspaceId,
      },
      ...(input.collectionId
        ? [
            {
              entityType: WatchEntityTypes.Collection,
              entityId: input.collectionId,
            },
          ]
        : []),
      { entityType: input.entityType, entityId: input.entityId },
    ];
  }
}

function normalizeWatchInput(input: WatchInput) {
  return {
    workspaceId: input.workspaceId,
    entityType: input.entityType,
    entityId: input.entityId,
  };
}
