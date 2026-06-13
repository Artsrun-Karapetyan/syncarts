import type { Workspace } from './types';

export function isSharedWorkspace(workspace: Pick<Workspace, 'members' | 'ownerId'> | undefined) {
  const members = workspace?.members ?? [];

  return members.length > 1 || members.some((member) => member.userId !== workspace?.ownerId);
}

export function isMemberWorkspace(workspace: Pick<Workspace, 'ownerId'> | undefined, userId: string | undefined) {
  return !!workspace?.ownerId && !!userId && workspace.ownerId !== userId;
}
