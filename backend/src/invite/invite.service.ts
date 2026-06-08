import { Injectable, NotFoundException, BadRequestException, Inject, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class InviteService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  private async syncWorkspaceSnapshots(
    workspaces: Array<{ id: string; name: string; collections?: any; environments?: any }>,
    userId: string,
  ) {
    for (const workspace of workspaces) {
      const existing = await this.prisma.workspace.findFirst({
        where: { id: workspace.id }
      });

      const workspaceData = {
        collections: workspace.collections ?? [],
        environments: workspace.environments ?? []
      };

      if (existing) {
        if (existing.ownerId !== userId) {
          throw new ForbiddenException('Only the workspace owner can share this workspace');
        }

        await this.prisma.workspace.update({
          where: { id: workspace.id },
          data: {
            name: workspace.name || existing.name,
            data: workspaceData
          }
        });
        continue;
      }

      await this.prisma.workspace.create({
        data: {
          id: workspace.id,
          name: workspace.name || 'Workspace',
          ownerId: userId,
          data: workspaceData,
          members: {
            create: {
              userId,
              role: 'OWNER'
            }
          }
        }
      });
    }
  }

  private normalizeWorkspaceIds(workspaceIds?: string[], workspaceId?: string) {
    const ids = workspaceIds?.filter(Boolean) ?? (workspaceId ? [workspaceId] : []);
    return Array.from(new Set(ids));
  }

  private async getAccessibleWorkspaces(workspaceIds: string[], userId: string) {
    const workspaces = await this.prisma.workspace.findMany({
      where: {
        id: { in: workspaceIds },
        ownerId: userId
      },
      select: {
        id: true,
        name: true,
        owner: { select: { name: true, email: true } }
      }
    });

    if (workspaces.length !== workspaceIds.length) {
      throw new BadRequestException('One or more workspaces are unavailable or you are not the owner');
    }

    return workspaces;
  }

  private async getTargetWorkspaceIds(invite: { workspaceId?: string | null; workspaceIds?: string[] }) {
    return this.normalizeWorkspaceIds(invite.workspaceIds, invite.workspaceId ?? undefined);
  }

  async generateInviteLink(
    input: { workspaceIds?: string[]; workspaces?: Array<{ id: string; name: string; collections?: any; environments?: any }> },
    userId: string,
    expiresInDays: number = 7,
  ) {
    const targetWorkspaceIds = this.normalizeWorkspaceIds(input.workspaceIds);
    const targetWorkspaces = input.workspaces || [];
    if (targetWorkspaceIds.length === 0) {
      throw new BadRequestException('Select at least one workspace');
    }

    if (targetWorkspaces.length > 0) {
      await this.syncWorkspaceSnapshots(targetWorkspaces, userId);
    }

    await this.getAccessibleWorkspaces(targetWorkspaceIds, userId);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    const inviteData = {
      workspaceIds: targetWorkspaceIds,
      expiresAt
    } as const;

    const invite = await this.prisma.workspaceInvite.create({
      data: inviteData as any
    });
    return invite;
  }

  async addMemberByEmail(
    input: { workspaceIds?: string[]; workspaces?: Array<{ id: string; name: string; collections?: any; environments?: any }> },
    email: string,
    ownerId: string,
  ) {
    const targetWorkspaceIds = this.normalizeWorkspaceIds(input.workspaceIds);
    const targetWorkspaces = input.workspaces || [];
    if (targetWorkspaceIds.length === 0) {
      throw new BadRequestException('Select at least one workspace');
    }

    if (targetWorkspaces.length > 0) {
      await this.syncWorkspaceSnapshots(targetWorkspaces, ownerId);
    }

    await this.getAccessibleWorkspaces(targetWorkspaceIds, ownerId);

    const userToAdd = await this.prisma.user.findUnique({ where: { email } });
    if (!userToAdd) {
      throw new NotFoundException('User with this email not found. They must sign up first.');
    }

    for (const workspaceId of targetWorkspaceIds) {
      const existingMember = await this.prisma.workspaceMember.findUnique({
        where: {
          userId_workspaceId: {
            userId: userToAdd.id,
            workspaceId
          }
        }
      });

      if (existingMember) {
        continue;
      }

      await this.prisma.workspaceMember.create({
        data: {
          userId: userToAdd.id,
          workspaceId,
          role: 'MEMBER'
        }
      });
    }

    return { status: 'added', workspaceIds: targetWorkspaceIds };
  }

  async getInviteInfo(token: string) {
    const invite = await this.prisma.workspaceInvite.findUnique({
      where: { token }
    });

    if (!invite) throw new NotFoundException('Invite not found');
    if (invite.expiresAt && invite.expiresAt < new Date()) {
      throw new BadRequestException('Invite expired');
    }

    const workspaceIds = await this.getTargetWorkspaceIds(invite);
    const workspaces = workspaceIds.length > 0
      ? await this.prisma.workspace.findMany({
          where: { id: { in: workspaceIds } },
          select: {
            id: true,
            name: true,
            owner: { select: { name: true } }
          }
        })
      : [];

    return {
      ...invite,
      workspaces
    };
  }

  async acceptInvite(token: string, userId: string) {
    const invite = await this.getInviteInfo(token); // Re-validates expiration

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    if (invite.invitedEmail && invite.invitedEmail !== user.email) {
      throw new BadRequestException('This invite is for a different email address');
    }

    const workspaceIds = await this.getTargetWorkspaceIds(invite);
    if (workspaceIds.length === 0) {
      throw new BadRequestException('Invite is missing workspace targets');
    }

    const existingWorkspaceCount = await this.prisma.workspace.count({
      where: { id: { in: workspaceIds } }
    });

    if (existingWorkspaceCount !== workspaceIds.length) {
      throw new BadRequestException('One or more invited workspaces no longer exist');
    }

    for (const workspaceId of workspaceIds) {
      const existingMember = await this.prisma.workspaceMember.findUnique({
        where: {
          userId_workspaceId: {
            userId,
            workspaceId
          }
        }
      });

      if (!existingMember) {
        await this.prisma.workspaceMember.create({
          data: {
            userId,
            workspaceId,
            role: 'MEMBER'
          }
        });
      }
    }

    // Optionally delete the invite if it was a single-use direct invite
    if (invite.invitedEmail) {
      await this.prisma.workspaceInvite.delete({ where: { token } });
    }

    return { status: 'joined', workspaceIds };
  }
}
