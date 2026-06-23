import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  Optional,
} from "@nestjs/common";
import type { Prisma } from "@prisma/client";

import { PrismaService } from "../prisma/prisma.service.js";
import { WatchService } from "../watch/watch.service.js";
import { WorkspaceRealtimeService } from "./workspace-realtime.service.js";
import { getWorkspaceAccess } from "./workspaceAccess.js";
import {
  normalizeWorkspaceData,
  readWorkspaceData,
  replaceWorkspaceData,
} from "./workspaceData.js";
import { WorkspaceEventTypes } from "./workspaceEvents.js";
import {
  canAssignWorkspaceRole,
  canWriteWorkspace,
  WorkspaceRoles,
} from "./workspaceRoles.js";
import { toWorkspaceSyncInput } from "./workspaceSyncInput.js";
import { notifyWorkspaceWatchers } from "./workspaceWatchNotifications.js";

const workspaceMemberInclude = {
  user: { select: { id: true, name: true, email: true } },
} satisfies Prisma.WorkspaceMemberInclude;

const workspaceMetaSelect = {
  id: true,
  name: true,
  ownerId: true,
  createdAt: true,
  updatedAt: true,
  version: true,
  members: {
    include: workspaceMemberInclude,
  },
} satisfies Prisma.WorkspaceSelect;

@Injectable()
export class WorkspaceService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Optional()
    @Inject(WorkspaceRealtimeService)
    private readonly realtime?: WorkspaceRealtimeService,
    @Optional()
    @Inject(WatchService)
    private readonly watches?: WatchService,
  ) {}

  async createWorkspace(name: string, ownerId: string) {
    const workspace = await this.prisma.workspace.create({
      data: {
        name,
        ownerId,
        members: {
          create: {
            userId: ownerId,
            role: WorkspaceRoles.Owner,
          },
        },
      },
    });
    return workspace;
  }

  async getWorkspacesForUser(userId: string) {
    const owned = await this.prisma.workspace.findMany({
      where: {
        ownerId: userId,
        id: { not: "default" },
      },
      select: workspaceMetaSelect,
    });

    const memberOf = await this.prisma.workspaceMember.findMany({
      where: { userId },
      include: {
        workspace: {
          select: workspaceMetaSelect,
        },
      },
    });

    const workspacesMap = new Map();
    owned.forEach((w) => workspacesMap.set(w.id, w));
    memberOf.forEach((m) => {
      if (m.workspaceId === "default" && m.workspace.ownerId === userId) return;
      workspacesMap.set(m.workspaceId, m.workspace);
    });

    return Array.from(workspacesMap.values());
  }

  async getWorkspaceForUser(workspaceId: string, userId: string) {
    const workspace = await this.prisma.workspace.findFirst({
      where: {
        id: workspaceId,
        OR: [{ ownerId: userId }, { members: { some: { userId } } }],
      },
      include: {
        members: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
      },
    });

    if (
      !workspace ||
      (workspace.id === "default" && workspace.ownerId === userId)
    ) {
      throw new NotFoundException("Workspace not found or unauthorized");
    }

    /* istanbul ignore next */
    return {
      ...workspace,
      data: await readWorkspaceData(this.prisma, workspace.id),
    };
  }

  async ensureWorkspaceAccess(workspaceId: string, userId: string) {
    await getWorkspaceAccess(this.prisma, workspaceId, userId);
  }

  async syncWorkspace(workspaceId: string, data: unknown, userId: string) {
    const input = toWorkspaceSyncInput(data);
    const workspaceData = normalizeWorkspaceData(input);

    const existing = await this.prisma.workspace.findFirst({
      where: { id: workspaceId },
      include: { members: true },
    });

    if (existing) {
      const member = existing.members.find((m) => m.userId === userId);
      const isOwner = existing.ownerId === userId;

      if (!member && !isOwner) {
        throw new ForbiddenException(
          "Only workspace members or owners can sync this workspace",
        );
      }

      if (!canWriteWorkspace(member?.role, isOwner)) {
        throw new ForbiddenException(
          "You only have view access to this workspace",
        );
      }

      const updateData = {
        name: input.name ?? existing.name,
        version: { increment: 1 },
      };

      if (input.version !== undefined) {
        return this.prisma.$transaction(async (transaction) => {
          const result = await transaction.workspace.updateMany({
            where: { id: workspaceId, version: input.version },
            data: updateData,
          });

          if (result.count === 0) {
            throw new ConflictException(
              "Workspace has changed. Please reload.",
            );
          }

          await replaceWorkspaceData(transaction, workspaceId, workspaceData);
          const workspace = await transaction.workspace.findUnique({
            where: { id: workspaceId },
            select: workspaceMetaSelect,
          });
          this.emitWorkspaceUpdated(workspaceId, workspace?.version);
          await notifyWorkspaceWatchers({
            watches: this.watches,
            workspaceId,
            userId,
          });
          return workspace;
        });
      }

      return this.prisma.$transaction(async (transaction) => {
        await replaceWorkspaceData(transaction, workspaceId, workspaceData);
        const workspace = await transaction.workspace.update({
          where: { id: workspaceId },
          data: updateData,
          select: workspaceMetaSelect,
        });
        this.emitWorkspaceUpdated(workspaceId, workspace.version);
        await notifyWorkspaceWatchers({
          watches: this.watches,
          workspaceId,
          userId,
        });
        return workspace;
      });
    }

    return this.prisma.$transaction(async (transaction) => {
      const workspace = await transaction.workspace.create({
        data: {
          id: workspaceId,
          name: input.name ?? "Workspace",
          ownerId: userId,
          members: {
            create: {
              userId,
              role: WorkspaceRoles.Owner,
            },
          },
        },
        select: workspaceMetaSelect,
      });
      await replaceWorkspaceData(transaction, workspaceId, workspaceData);
      this.emitWorkspaceUpdated(workspaceId, workspace.version);
      return workspace;
    });
  }

  async deleteWorkspace(workspaceId: string, userId: string) {
    const workspace = await this.prisma.workspace.findFirst({
      where: {
        id: workspaceId,
        OR: [{ ownerId: userId }, { members: { some: { userId } } }],
      },
    });

    if (!workspace) {
      throw new NotFoundException("Workspace not found or unauthorized");
    }

    if (workspace.ownerId === userId) {
      await this.prisma.$transaction(async (transaction) => {
        await transaction.workspaceInvite.deleteMany({
          where: { workspaceIds: { has: workspaceId } },
        });
        await transaction.workspace.delete({ where: { id: workspaceId } });
      });
      return { status: "deleted", workspaceId };
    }

    await this.prisma.workspaceMember.delete({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId,
        },
      },
    });

    return { status: "left", workspaceId };
  }

  async removeMember(
    workspaceId: string,
    memberUserId: string,
    userId: string,
  ) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
    });

    if (!workspace || workspace.ownerId !== userId) {
      throw new ForbiddenException(
        "Only the workspace owner can remove members",
      );
    }

    if (memberUserId === workspace.ownerId) {
      throw new ForbiddenException("The workspace owner cannot be removed");
    }

    await this.prisma.workspaceMember.deleteMany({
      where: {
        userId: memberUserId,
        workspaceId,
      },
    });

    return { status: "removed", workspaceId, userId: memberUserId };
  }

  async updateMemberRole({
    workspaceId,
    memberUserId,
    role,
    userId,
  }: {
    workspaceId: string;
    memberUserId: string;
    role: string;
    userId: string;
  }) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
    });

    if (!workspace || workspace.ownerId !== userId) {
      throw new ForbiddenException(
        "Only the workspace owner can update member roles",
      );
    }

    if (memberUserId === workspace.ownerId) {
      throw new ForbiddenException(
        "The workspace owner role cannot be changed",
      );
    }

    if (!canAssignWorkspaceRole(role)) {
      throw new ForbiddenException(
        "Invalid role. Must be ADMIN, EDITOR, or VIEWER",
      );
    }

    await this.prisma.workspaceMember.update({
      where: {
        userId_workspaceId: {
          userId: memberUserId,
          workspaceId,
        },
      },
      data: { role },
    });

    return { status: "updated", workspaceId, userId: memberUserId, role };
  }

  private emitWorkspaceUpdated(workspaceId: string, version?: number) {
    this.realtime?.emit({
      type: WorkspaceEventTypes.WorkspaceUpdated,
      workspaceId,
      entityType: "workspace",
      entityId: workspaceId,
      version,
    });
  }
}
