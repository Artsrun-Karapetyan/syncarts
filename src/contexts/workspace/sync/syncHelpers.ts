import type { Workspace } from "../core/types";

export function shouldSkipLegacyDefaultRemote(
  remote: any,
  localWorkspaces: Workspace[],
  localDefaultWorkspaceId: string,
  userId: string,
) {
  if (!remote.data) return false;
  const remoteData = remote.data || {};
  const localDefault = localWorkspaces.find(
    (workspace) => workspace.id === localDefaultWorkspaceId,
  );

  return (
    !!localDefault &&
    remote.id === "default" &&
    remote.ownerId === userId &&
    localDefault.name === remote.name &&
    JSON.stringify(localDefault.collections || []) ===
      JSON.stringify(remoteData.collections || [])
  );
}

export function normalizeLegacyWorkspaces(
  items: Workspace[],
  localDefaultWorkspaceId: string,
  userId: string,
) {
  const hasLocalDefault = items.some(
    (workspace) => workspace.id === localDefaultWorkspaceId,
  );
  const seenIds = new Set<string>();

  return items.filter((workspace) => {
    if (seenIds.has(workspace.id)) return false;
    seenIds.add(workspace.id);

    if (!hasLocalDefault || workspace.id === localDefaultWorkspaceId)
      return true;

    return !(
      workspace.name === "My Workspace" &&
      (workspace.id === "default" ||
        !workspace.ownerId ||
        workspace.ownerId === userId)
    );
  });
}

export function mapRemoteWorkspace(remote: any, local?: Workspace): Workspace {
  const remoteData = remote.data;
  return {
    ...local,
    id: remote.id,
    name: remote.name,
    ownerId: remote.ownerId,
    createdAt: remote.createdAt || local?.createdAt,
    updatedAt: remote.updatedAt || local?.updatedAt,
    version: remote.version ?? local?.version,
    members: remote.members || [],
    collections: remoteData?.collections || local?.collections || [],
    environments: remoteData?.environments || local?.environments || [],
    globalVariables:
      remoteData?.globalVariables || local?.globalVariables || [],
  };
}

export const getWorkspaceSyncPayload = (workspace: Workspace) => ({
  name: workspace.name,
  ownerId: workspace.ownerId,
  collections: workspace.collections,
  environments: workspace.environments || [],
  globalVariables: workspace.globalVariables || [],
});

export const getRemoteSyncPayload = (remote: any) => ({
  name: remote.name || "",
  ownerId: remote.ownerId,
  collections: remote.data?.collections || [],
  environments: remote.data?.environments || [],
  globalVariables: remote.data?.globalVariables || [],
});

export const getSyncSignature = (payload: unknown) => JSON.stringify(payload);

export function canSyncWorkspace(workspace: Workspace, userId: string) {
  if (workspace.ownerId === userId || !workspace.ownerId) return true;
  const member = workspace.members?.find((m) => m.userId === userId);
  return member?.role !== "VIEWER";
}
