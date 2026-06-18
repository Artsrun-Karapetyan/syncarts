import { ForbiddenException, NotFoundException } from "@nestjs/common";

import type { PrismaService } from "../prisma/prisma.service.js";
import { canWriteWorkspace } from "./workspaceRoles.js";

type WorkspaceAccessClient = Pick<PrismaService, "workspace">;

export async function getWorkspaceAccess(
  client: WorkspaceAccessClient,
  workspaceId: string,
  userId: string,
  options: { canWrite?: boolean } = {},
) {
  const workspace = await client.workspace.findFirst({
    where: {
      id: workspaceId,
      OR: [{ ownerId: userId }, { members: { some: { userId } } }],
    },
    include: { members: true },
  });

  if (!workspace) {
    throw new NotFoundException("Workspace not found or unauthorized");
  }

  if (!options.canWrite) return workspace;

  const member = workspace.members.find((item) => item.userId === userId);
  const isOwner = workspace.ownerId === userId;
  if (!canWriteWorkspace(member?.role, isOwner)) {
    throw new ForbiddenException("You only have view access to this workspace");
  }

  return workspace;
}
