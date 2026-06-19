import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  Optional,
} from "@nestjs/common";
import type { Prisma } from "@prisma/client";

import type { PaginationOptions } from "../common/parsePaginationQuery.js";
import { NotificationService } from "../notification/notification.service.js";
import { NotificationAudience } from "../notification/notificationTypes.js";
import { PrismaService } from "../prisma/prisma.service.js";
import { readWorkspaceData } from "../workspace/workspaceData.js";

const mergeRequestInclude = {
  author: {
    select: { id: true, name: true, email: true },
  },
} satisfies Prisma.MergeRequestInclude;

@Injectable()
export class MergeRequestService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Optional()
    @Inject(NotificationService)
    private readonly notifications?: NotificationService,
  ) {}

  async createMergeRequest(data: {
    title: string;
    description?: string;
    sourceWorkspaceId: string;
    targetWorkspaceId: string;
    sourceCollectionId: string;
    targetCollectionId: string;
    authorId: string;
    data?: any;
    targetData?: any;
  }) {
    const targetWs = await this.prisma.workspace.findFirst({
      where: {
        id: data.targetWorkspaceId,
        OR: [
          { ownerId: data.authorId },
          { members: { some: { userId: data.authorId } } },
        ],
      },
    });
    if (!targetWs) throw new NotFoundException("Target workspace not found");

    if (!data.data) {
      throw new NotFoundException("Source collection snapshot not found");
    }

    // Snapshot the target collection at creation time if not provided
    let targetData = data.targetData;
    if (!targetData) {
      const wsData = await readWorkspaceData(
        this.prisma,
        data.targetWorkspaceId,
      );
      const collections = wsData.collections || [];
      targetData =
        collections.find((c: any) => c.id === data.targetCollectionId) || null;
    }

    const mergeRequest = await this.prisma.mergeRequest.create({
      data: {
        title: data.title,
        description: data.description,
        sourceWorkspaceId: data.sourceWorkspaceId,
        targetWorkspaceId: data.targetWorkspaceId,
        sourceCollectionId: data.sourceCollectionId,
        targetCollectionId: data.targetCollectionId,
        data: data.data,
        targetData,
        authorId: data.authorId,
        status: "OPEN",
      },
    });

    await this.notifyMergeRequestCreated(mergeRequest, targetWs.ownerId);
    return mergeRequest;
  }

  async getMergeRequestsForWorkspace(
    workspaceId: string,
    userId: string,
    pagination: PaginationOptions = {},
  ) {
    const workspace = await this.prisma.workspace.findFirst({
      where: {
        id: workspaceId,
        OR: [{ ownerId: userId }, { members: { some: { userId } } }],
      },
    });
    if (!workspace) {
      throw new NotFoundException("Workspace not found or unauthorized");
    }
    if (workspace.ownerId !== userId) return [];

    return this.prisma.mergeRequest.findMany({
      where: { targetWorkspaceId: workspaceId },
      include: mergeRequestInclude,
      orderBy: { createdAt: "desc" },
      skip: pagination.skip,
      take: pagination.take,
    });
  }

  async getMergeRequestById(id: string, userId: string) {
    const mr = await this.prisma.mergeRequest.findUnique({
      where: { id },
      include: mergeRequestInclude,
    });
    if (!mr) throw new NotFoundException("Merge request not found");
    await this.ensureMergeRequestReadable(mr, userId);
    return mr;
  }

  async updateMergeRequestStatus(id: string, status: string, userId: string) {
    const mr = await this.prisma.mergeRequest.findUnique({ where: { id } });
    if (!mr) throw new NotFoundException("Merge request not found");

    await this.ensureTargetWorkspaceOwner(mr.targetWorkspaceId, userId);

    return this.prisma.mergeRequest.update({
      where: { id },
      data: { status, updatedAt: new Date() },
    });
  }

  async deleteMergeRequest(id: string, userId: string) {
    const mr = await this.prisma.mergeRequest.findUnique({ where: { id } });
    if (!mr) throw new NotFoundException("Merge request not found");

    const isAuthor = mr.authorId === userId;
    const targetWorkspace = await this.prisma.workspace.findUnique({
      where: { id: mr.targetWorkspaceId },
    });
    const isTargetOwner = targetWorkspace?.ownerId === userId;

    if (!isAuthor && !isTargetOwner) {
      throw new ForbiddenException(
        "Only the author or the target workspace owner can delete this merge request",
      );
    }

    return this.prisma.mergeRequest.delete({ where: { id } });
  }

  async getSourceCollection(mrId: string, userId: string) {
    const mr = await this.prisma.mergeRequest.findUnique({
      where: { id: mrId },
    });
    if (!mr) throw new NotFoundException("Merge request not found");
    await this.ensureMergeRequestReadable(mr, userId);

    if (!mr.data) {
      throw new NotFoundException("Merge request has no source snapshot");
    }

    return mr.data;
  }

  async getTargetCollection(mrId: string, userId: string) {
    const mr = await this.prisma.mergeRequest.findUnique({
      where: { id: mrId },
    });
    if (!mr) throw new NotFoundException("Merge request not found");
    await this.ensureMergeRequestReadable(mr, userId);

    if (!mr.targetData) {
      throw new NotFoundException("Merge request has no target snapshot");
    }

    return mr.targetData;
  }

  private async ensureMergeRequestReadable(
    mr: { authorId: string; targetWorkspaceId: string },
    userId: string,
  ) {
    if (mr.authorId === userId) return;
    await this.ensureTargetWorkspaceOwner(mr.targetWorkspaceId, userId);
  }

  private async ensureTargetWorkspaceOwner(
    workspaceId: string,
    userId: string,
  ) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
    });
    if (!workspace || workspace.ownerId !== userId) {
      throw new ForbiddenException(
        "Only the target workspace owner can update this merge request",
      );
    }
  }

  private async notifyMergeRequestCreated(
    mergeRequest: { id: string; title: string; authorId: string },
    targetOwnerId: string,
  ) {
    if (!this.notifications || targetOwnerId === mergeRequest.authorId) return;

    const actor = await this.prisma.user.findUnique({
      where: { id: mergeRequest.authorId },
      select: { name: true, email: true },
    });

    try {
      await this.notifications.createNotification({
        userId: targetOwnerId,
        workspaceId: undefined,
        type: "MERGE_REQUEST_CREATED",
        audience: NotificationAudience.Direct,
        title: "Merge request created",
        message: `${actor?.name || actor?.email || "Someone"} requested ${mergeRequest.title}`,
        entityType: "merge_request",
        entityId: mergeRequest.id,
        actorId: mergeRequest.authorId,
        actorName: actor?.name || actor?.email || null,
        actionUrl: "/merge-requests",
        actionLabel: "Review",
        metadata: { mergeRequestId: mergeRequest.id },
      });
    } catch (error) {
      console.warn("Failed to create merge request notification", error);
    }
  }
}
