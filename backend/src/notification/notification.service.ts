import { Inject, Injectable, NotFoundException } from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service.js";
import {
  type CreateNotificationInput,
  NotificationAudience,
} from "./notificationTypes.js";

export type NotificationTab = "direct" | "watching" | "all";

@Injectable()
export class NotificationService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async createNotification(input: CreateNotificationInput) {
    return this.prisma.notification.create({
      data: {
        ...input,
        audience: input.audience ?? NotificationAudience.All,
      } as any,
    });
  }

  async createNotifications(inputs: CreateNotificationInput[]) {
    if (inputs.length === 0) return { count: 0 };
    return this.prisma.notification.createMany({
      data: inputs.map((input) => ({
        ...input,
        audience: input.audience ?? NotificationAudience.All,
      })) as any,
      skipDuplicates: false,
    });
  }

  async listNotifications(userId: string, tab: NotificationTab, take = 50) {
    return this.prisma.notification.findMany({
      where: this.buildListWhere(userId, tab),
      orderBy: { createdAt: "desc" },
      take: Math.min(Math.max(take, 1), 100),
    });
  }

  async getCounts(userId: string) {
    const [direct, watching, all] = await Promise.all([
      this.prisma.notification.count({
        where: this.buildUnreadWhere(userId, "direct"),
      }),
      this.prisma.notification.count({
        where: this.buildUnreadWhere(userId, "watching"),
      }),
      this.prisma.notification.count({
        where: this.buildUnreadWhere(userId, "all"),
      }),
    ]);

    return { direct, watching, all };
  }

  async markRead(userId: string, id: string, isRead = true) {
    const result = await this.prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead, readAt: isRead ? new Date() : null },
    });

    if (result.count === 0) {
      throw new NotFoundException("Notification not found");
    }
    return { success: true };
  }

  async markAllRead(userId: string, tab: NotificationTab = "all") {
    const result = await this.prisma.notification.updateMany({
      where: this.buildUnreadWhere(userId, tab),
      data: { isRead: true, readAt: new Date() },
    });

    return { success: true, count: result.count };
  }

  async getPreferences(userId: string) {
    return this.prisma.notificationPreference.findMany({
      where: { userId },
      orderBy: { type: "asc" },
    });
  }

  async updatePreference(
    userId: string,
    input: { type: string; channel?: string; enabled: boolean },
  ) {
    const channel = input.channel ?? "IN_APP";
    return this.prisma.notificationPreference.upsert({
      where: { userId_type_channel: { userId, type: input.type, channel } },
      update: { enabled: input.enabled },
      create: { userId, type: input.type, channel, enabled: input.enabled },
    });
  }

  private buildListWhere(userId: string, tab: NotificationTab) {
    return {
      userId,
      isArchived: false,
      ...(tab === "direct" ? { audience: NotificationAudience.Direct } : {}),
      ...(tab === "watching"
        ? { audience: NotificationAudience.Watching }
        : {}),
    };
  }

  private buildUnreadWhere(userId: string, tab: NotificationTab) {
    return { ...this.buildListWhere(userId, tab), isRead: false };
  }
}
