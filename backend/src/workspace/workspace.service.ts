import { ForbiddenException, Injectable, Inject, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

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
            role: 'OWNER'
          }
        }
      }
    });
    return workspace;
  }

  async getWorkspacesForUser(userId: string) {
    const owned = await this.prisma.workspace.findMany({
      where: {
        ownerId: userId,
        id: { not: 'default' }
      },
      include: {
        members: { include: { user: { select: { id: true, name: true, email: true } } } }
      }
    });

    const memberOf = await this.prisma.workspaceMember.findMany({
      where: { userId },
      include: {
        workspace: {
          include: {
            members: { include: { user: { select: { id: true, name: true, email: true } } } }
          }
        }
      }
    });

    const workspacesMap = new Map();
    owned.forEach(w => workspacesMap.set(w.id, w));
    memberOf.forEach(m => {
      if (m.workspaceId === 'default' && m.workspace.ownerId === userId) return;
      workspacesMap.set(m.workspaceId, m.workspace);
    });

    return Array.from(workspacesMap.values());
  }

  async syncWorkspace(workspaceId: string, data: any, userId: string) {
    if (data?.ownerId && data.ownerId !== userId) {
      throw new ForbiddenException('Shared workspaces cannot be synced by members');
    }

    const workspaceData = {
      collections: data?.collections ?? [],
      environments: data?.environments ?? []
    };

    const existing = await this.prisma.workspace.findFirst({
      where: { id: workspaceId }
    });

    if (existing) {
      if (existing.ownerId !== userId) {
        throw new ForbiddenException('Only the workspace owner can sync this workspace');
      }

      return this.prisma.workspace.update({
        where: { id: workspaceId },
        data: {
          name: data?.name ?? existing.name,
          data: workspaceData
        }
      });
    }

    return this.prisma.workspace.create({
      data: {
        id: workspaceId,
        name: data?.name ?? 'Workspace',
        ownerId: userId,
        members: {
          create: {
            userId,
            role: 'OWNER'
          }
        },
        data: workspaceData
      }
    });
  }

  async deleteWorkspace(workspaceId: string, userId: string) {
    const workspace = await this.prisma.workspace.findFirst({
      where: {
        id: workspaceId,
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } }
        ]
      }
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found or unauthorized');
    }

    if (workspace.ownerId === userId) {
      await this.prisma.workspaceInvite.deleteMany({
        where: { workspaceIds: { has: workspaceId } }
      });
      await this.prisma.workspace.delete({ where: { id: workspaceId } });
      return { status: 'deleted', workspaceId };
    }

    await this.prisma.workspaceMember.delete({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId
        }
      }
    });

    return { status: 'left', workspaceId };
  }
}
