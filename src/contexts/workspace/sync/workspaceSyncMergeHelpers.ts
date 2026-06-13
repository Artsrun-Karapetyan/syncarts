import type { Workspace } from "../core/types";
import {
  getRemoteSyncPayload,
  getSyncSignature,
  getWorkspaceSyncPayload,
  mapRemoteWorkspace,
} from "./syncHelpers";

interface WorkspaceSyncMergeArgs {
  deletedWorkspaceIdsRef: React.MutableRefObject<Set<string>>;
  dirtyWorkspaceIdsRef: React.MutableRefObject<Set<string>>;
  lastSyncedSignaturesRef: React.MutableRefObject<Record<string, string>>;
  localDefaultWorkspaceId: string;
  syncingWorkspaceIdsRef: React.MutableRefObject<Set<string>>;
  userId: string;
}

export function removeUnavailableRemoteWorkspaces(
  items: Workspace[],
  remoteIds: Set<string>,
  args: Pick<
    WorkspaceSyncMergeArgs,
    "deletedWorkspaceIdsRef" | "localDefaultWorkspaceId"
  >,
) {
  const { deletedWorkspaceIdsRef, localDefaultWorkspaceId } = args;
  return items.filter((workspace) => {
    if (deletedWorkspaceIdsRef.current.has(workspace.id)) return false;
    if (workspace.id === localDefaultWorkspaceId) return true;
    const isRemoteBackedWorkspace = !!workspace.ownerId;
    return !isRemoteBackedWorkspace || remoteIds.has(workspace.id);
  });
}

export function mergeInitialRemoteWorkspace(
  remote: any,
  nextLocals: Workspace[],
  hasChanges: boolean,
  args: WorkspaceSyncMergeArgs,
) {
  const {
    dirtyWorkspaceIdsRef,
    lastSyncedSignaturesRef,
    syncingWorkspaceIdsRef,
    userId,
  } = args;
  const localIndex = nextLocals.findIndex((w) => w.id === remote.id);
  const remoteSignature = getSyncSignature(getRemoteSyncPayload(remote));

  if (localIndex === -1) {
    nextLocals.push(mapRemoteWorkspace(remote));
    lastSyncedSignaturesRef.current[remote.id] = remoteSignature;
    return true;
  }

  const local = nextLocals[localIndex];
  const remoteWorkspace = mapRemoteWorkspace(remote, local);
  const member = remote.members?.find((m: any) => m.userId === userId);
  const isViewer = member?.role === "VIEWER";
  const localSignature = getSyncSignature(getWorkspaceSyncPayload(local));
  const hasPendingLocalChanges =
    dirtyWorkspaceIdsRef.current.has(remote.id) ||
    syncingWorkspaceIdsRef.current.has(remote.id);

  if (isViewer && remote.ownerId !== userId) {
    lastSyncedSignaturesRef.current[remote.id] = remoteSignature;
    if (JSON.stringify(local) !== JSON.stringify(remoteWorkspace)) {
      nextLocals[localIndex] = remoteWorkspace;
      return true;
    }
    return hasChanges;
  }

  if (hasPendingLocalChanges) {
    nextLocals[localIndex] = withRemoteMembers(local, remote);
    return true;
  }

  if (localSignature !== remoteSignature) {
    nextLocals[localIndex] = remoteWorkspace;
    lastSyncedSignaturesRef.current[remote.id] = remoteSignature;
    return true;
  }

  lastSyncedSignaturesRef.current[remote.id] = remoteSignature;

  if (hasDifferentMembers(local, remote)) {
    nextLocals[localIndex] = withRemoteMembers(local, remote);
    return true;
  }

  return hasChanges;
}

export function mergePolledRemoteWorkspace(
  remote: any,
  nextLocals: Workspace[],
  hasChanges: boolean,
  args: WorkspaceSyncMergeArgs,
) {
  const {
    dirtyWorkspaceIdsRef,
    lastSyncedSignaturesRef,
    syncingWorkspaceIdsRef,
    userId,
  } = args;
  const localIndex = nextLocals.findIndex(
    (workspace) => workspace.id === remote.id,
  );
  const remoteWorkspace = mapRemoteWorkspace(
    remote,
    localIndex !== -1 ? nextLocals[localIndex] : undefined,
  );
  const remoteSignature = getSyncSignature(getRemoteSyncPayload(remote));

  if (localIndex === -1) {
    nextLocals.push(remoteWorkspace);
    lastSyncedSignaturesRef.current[remote.id] = remoteSignature;
    return true;
  }

  const local = nextLocals[localIndex];
  const localSignature = getSyncSignature(getWorkspaceSyncPayload(local));
  const lastSyncedSignature = lastSyncedSignaturesRef.current[remote.id];
  const hasPendingLocalChanges =
    dirtyWorkspaceIdsRef.current.has(remote.id) ||
    syncingWorkspaceIdsRef.current.has(remote.id);
  const member = remote.members?.find((m: any) => m.userId === userId);
  const isViewer = member?.role === "VIEWER";

  if (isViewer && remote.ownerId !== userId) {
    nextLocals[localIndex] = remoteWorkspace;
    lastSyncedSignaturesRef.current[remote.id] = remoteSignature;
    return true;
  }

  if (hasPendingLocalChanges) {
    nextLocals[localIndex] = withRemoteMembers(local, remote);
    return true;
  }

  if (!lastSyncedSignature) {
    lastSyncedSignaturesRef.current[remote.id] = remoteSignature;
    if (localSignature !== remoteSignature) {
      nextLocals[localIndex] = remoteWorkspace;
      return true;
    }
    return hasChanges;
  }

  if (remoteSignature !== lastSyncedSignature) {
    nextLocals[localIndex] = remoteWorkspace;
    lastSyncedSignaturesRef.current[remote.id] = remoteSignature;
    return true;
  }

  if (hasDifferentMembers(local, remote)) {
    nextLocals[localIndex] = withRemoteMembers(local, remote);
    return true;
  }

  return hasChanges;
}

function hasDifferentMembers(local: Workspace, remote: any) {
  return (
    JSON.stringify(local.members || []) !== JSON.stringify(remote.members || [])
  );
}

function withRemoteMembers(local: Workspace, remote: any) {
  return {
    ...local,
    ownerId: remote.ownerId,
    members: remote.members || [],
  };
}
