export const WorkspaceRoles = {
  Admin: "ADMIN",
  Editor: "EDITOR",
  Member: "MEMBER",
  Owner: "OWNER",
  Viewer: "VIEWER",
} as const;

export const assignableWorkspaceRoles = [
  WorkspaceRoles.Admin,
  WorkspaceRoles.Editor,
  WorkspaceRoles.Viewer,
] as const;

export type WorkspaceRole =
  (typeof WorkspaceRoles)[keyof typeof WorkspaceRoles];

export function normalizeWorkspaceRole(role?: string | null): WorkspaceRole {
  if (role === WorkspaceRoles.Member) return WorkspaceRoles.Editor;
  if (
    role === WorkspaceRoles.Admin ||
    role === WorkspaceRoles.Editor ||
    role === WorkspaceRoles.Owner ||
    role === WorkspaceRoles.Viewer
  ) {
    return role;
  }
  return WorkspaceRoles.Viewer;
}

export function canWriteWorkspace(role?: string | null, isOwner = false) {
  if (isOwner) return true;
  const normalizedRole = normalizeWorkspaceRole(role);
  return (
    normalizedRole === WorkspaceRoles.Admin ||
    normalizedRole === WorkspaceRoles.Editor
  );
}

export function canAssignWorkspaceRole(role: string) {
  return assignableWorkspaceRoles.includes(
    role as (typeof assignableWorkspaceRoles)[number],
  );
}
