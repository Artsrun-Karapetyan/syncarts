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
    const workspaceData = {
      collections: data?.collections ?? [],
      environments: data?.environments ?? [],
      globalVariables: data?.globalVariables ?? []
    };

    const existing = await this.prisma.workspace.findFirst({
      where: { id: workspaceId },
      include: { members: true }
    });

    if (existing) {
      const member = existing.members.find(m => m.userId === userId);
      if (!member) {
        throw new ForbiddenException('Only workspace members can sync this workspace');
      }
      
      if (member.role === 'VIEWER') {
        throw new ForbiddenException('You only have view access to this workspace');
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

  async removeMember(workspaceId: string, memberUserId: string, userId: string) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId }
    });

    if (!workspace || workspace.ownerId !== userId) {
      throw new ForbiddenException('Only the workspace owner can remove members');
    }

    if (memberUserId === workspace.ownerId) {
      throw new ForbiddenException('The workspace owner cannot be removed');
    }

    await this.prisma.workspaceMember.deleteMany({
      where: {
        userId: memberUserId,
        workspaceId
      }
    });

    return { status: 'removed', workspaceId, userId: memberUserId };
  }

  async updateMemberRole(workspaceId: string, memberUserId: string, role: string, userId: string) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId }
    });

    if (!workspace || workspace.ownerId !== userId) {
      throw new ForbiddenException('Only the workspace owner can update member roles');
    }

    if (memberUserId === workspace.ownerId) {
      throw new ForbiddenException('The workspace owner role cannot be changed');
    }

    if (!['MEMBER', 'EDITOR', 'VIEWER'].includes(role)) {
      throw new ForbiddenException('Invalid role. Must be MEMBER, EDITOR, or VIEWER');
    }

    await this.prisma.workspaceMember.update({
      where: {
        userId_workspaceId: {
          userId: memberUserId,
          workspaceId
        }
      },
      data: { role }
    });

    return { status: 'updated', workspaceId, userId: memberUserId, role };
  }
}
