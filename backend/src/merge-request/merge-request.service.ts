import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import type { PaginationOptions } from "../common/parsePaginationQuery.js";
import { PrismaService } from "../prisma/prisma.service.js";

@Injectable()
export class MergeRequestService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

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
    const targetWs = await this.prisma.workspace.findUnique({
      where: { id: data.targetWorkspaceId },
    });
    if (!targetWs) throw new NotFoundException("Target workspace not found");

    // Snapshot the target collection at creation time if not provided
    let targetData = data.targetData;
    if (!targetData && targetWs.data) {
      const wsData: any = targetWs.data;
      const collections = wsData.collections || [];
      targetData =
        collections.find((c: any) => c.id === data.targetCollectionId) || null;
    }

    return this.prisma.mergeRequest.create({
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
  }

  async getMergeRequestsForWorkspace(
    workspaceId: string,
    pagination: PaginationOptions = {},
  ) {
    return this.prisma.mergeRequest.findMany({
      where: {
        OR: [
          { targetWorkspaceId: workspaceId },
          { sourceWorkspaceId: workspaceId },
        ],
      },
      include: {
        author: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: pagination.skip,
      take: pagination.take,
    });
  }

  async getMergeRequestById(id: string) {
    return this.prisma.mergeRequest.findUnique({
      where: { id },
      include: {
        author: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  async updateMergeRequestStatus(id: string, status: string, userId: string) {
    const mr = await this.prisma.mergeRequest.findUnique({ where: { id } });
    if (!mr) throw new NotFoundException("Merge request not found");

    // Basic permission check: only target workspace owner/admin or MR author can update
    // For now, allow any member of the target workspace or the author
    const isAuthor = mr.authorId === userId;

    // Check if user is member of target workspace
    const member = await this.prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: { userId, workspaceId: mr.targetWorkspaceId },
      },
    });
    const targetWorkspace = await this.prisma.workspace.findUnique({
      where: { id: mr.targetWorkspaceId },
    });
    const isTargetOwner = targetWorkspace?.ownerId === userId;

    if (!isAuthor && !member && !isTargetOwner) {
      throw new ForbiddenException("Unauthorized to update this merge request");
    }

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

  async getSourceCollection(mrId: string) {
    const mr = await this.prisma.mergeRequest.findUnique({
      where: { id: mrId },
    });
    if (!mr) throw new NotFoundException("Merge request not found");

    if (!mr.data) {
      throw new NotFoundException("Merge request has no source snapshot");
    }

    return mr.data;
  }

  async getTargetCollection(mrId: string) {
    const mr = await this.prisma.mergeRequest.findUnique({
      where: { id: mrId },
    });
    if (!mr) throw new NotFoundException("Merge request not found");

    if (!mr.targetData) {
      throw new NotFoundException("Merge request has no target snapshot");
    }

    return mr.targetData;
  }
}
