import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { Prisma } from "@prisma/client";

import { PrismaService } from "../prisma/prisma.service.js";

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
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async createWorkspace(name: string, ownerId: string) {
    const workspace = await this.prisma.workspace.create({
      data: {
        name,
        ownerId,
        members: {
          create: {
            userId: ownerId,
            role: "OWNER",
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

    return workspace;
  }

  async syncWorkspace(workspaceId: string, data: unknown, userId: string) {
    const input = toWorkspaceSyncInput(data);
    const workspaceData: Prisma.InputJsonObject = {
      collections: input.collections ?? [],
      environments: input.environments ?? [],
      globalVariables: input.globalVariables ?? [],
    };

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

      if (member?.role === "VIEWER" && !isOwner) {
        throw new ForbiddenException(
          "You only have view access to this workspace",
        );
      }

      const updateData = {
        name: input.name ?? existing.name,
        data: workspaceData,
        version: { increment: 1 },
      };

      if (input.version !== undefined) {
        const result = await this.prisma.workspace.updateMany({
          where: { id: workspaceId, version: input.version },
          data: updateData,
        });

        if (result.count === 0) {
          throw new ConflictException("Workspace has changed. Please reload.");
        }

        return this.prisma.workspace.findUnique({
          where: { id: workspaceId },
          select: workspaceMetaSelect,
        });
      }

      return this.prisma.workspace.update({
        where: { id: workspaceId },
        data: updateData,
        select: workspaceMetaSelect,
      });
    }

    return this.prisma.workspace.create({
      data: {
        id: workspaceId,
        name: input.name ?? "Workspace",
        ownerId: userId,
        members: {
          create: {
            userId,
            role: "OWNER",
          },
        },
        data: workspaceData,
      },
      select: workspaceMetaSelect,
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

    if (!["MEMBER", "EDITOR", "VIEWER"].includes(role)) {
      throw new ForbiddenException(
        "Invalid role. Must be MEMBER, EDITOR, or VIEWER",
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
}

type WorkspaceSyncInput = {
  name?: string;
  version?: number;
  collections?: Prisma.InputJsonValue;
  environments?: Prisma.InputJsonValue;
  globalVariables?: Prisma.InputJsonValue;
};

function toWorkspaceSyncInput(value: unknown): WorkspaceSyncInput {
  if (typeof value !== "object" || value === null) {
    return {};
  }

  const input = value as Record<string, Prisma.InputJsonValue | undefined>;
  return {
    name: typeof input.name === "string" ? input.name : undefined,
    version: typeof input.version === "number" ? input.version : undefined,
    collections: input.collections,
    environments: input.environments,
    globalVariables: input.globalVariables,
  };
}
