import { useEffect } from 'react';
import { api } from '../../lib/api';
import {
  canSyncWorkspace,
  getRemoteSyncPayload,
  getSyncSignature,
  getWorkspaceSyncPayload,
  mapRemoteWorkspace,
  normalizeLegacyWorkspaces,
  shouldSkipLegacyDefaultRemote
} from './syncHelpers';
import type { Workspace } from './types';

type SetWorkspaces = (value: Workspace[] | ((prev: Workspace[]) => Workspace[])) => void;

interface WorkspaceSyncArgs {
  activeWorkspaceId: string;
  deletedWorkspaceIdsRef: React.MutableRefObject<Set<string>>;
  dirtyWorkspaceIdsRef: React.MutableRefObject<Set<string>>;
  lastSyncedSignaturesRef: React.MutableRefObject<Record<string, string>>;
  localDefaultWorkspaceId: string;
  setWorkspaces: SetWorkspaces;
  syncingWorkspaceIdsRef: React.MutableRefObject<Set<string>>;
  userId: string;
  workspaces: Workspace[];
}

export function useWorkspaceSync(args: WorkspaceSyncArgs) {
  const {
    activeWorkspaceId,
    deletedWorkspaceIdsRef,
    dirtyWorkspaceIdsRef,
    lastSyncedSignaturesRef,
    localDefaultWorkspaceId,
    setWorkspaces,
    syncingWorkspaceIdsRef,
    userId,
    workspaces
  } = args;

  const removeUnavailableRemoteWorkspaces = (items: Workspace[], remoteIds: Set<string>) => {
    return items.filter((workspace) => {
      if (deletedWorkspaceIdsRef.current.has(workspace.id)) return false;
      if (workspace.id === localDefaultWorkspaceId) return true;
      const isRemoteBackedWorkspace = !!workspace.ownerId;
      return !isRemoteBackedWorkspace || remoteIds.has(workspace.id);
    });
  };

  const reloadWorkspaces = async () => {
    try {
      const res: any = await api.get('/workspaces');
      const remoteWorkspaces = (res.data || []).filter((remote: any) => !deletedWorkspaceIdsRef.current.has(remote.id));
      const remoteIds = new Set<string>(remoteWorkspaces.map((remote: any) => remote.id));

      setWorkspaces((prevLocals) => {
        const nextLocals = [...removeUnavailableRemoteWorkspaces(prevLocals, remoteIds)];
        for (const remote of remoteWorkspaces) {
          if (shouldSkipLegacyDefaultRemote(remote, nextLocals, localDefaultWorkspaceId, userId)) continue;
          const remoteData = remote.data || { collections: [], environments: [] };
          const localIndex = nextLocals.findIndex((workspace) => workspace.id === remote.id);

          if (localIndex === -1) {
            nextLocals.push({ ...mapRemoteWorkspace(remote), collections: remoteData.collections || [], environments: remoteData.environments || [] });
            continue;
          }
          nextLocals[localIndex] = mapRemoteWorkspace(remote, nextLocals[localIndex]);
        }

        return normalizeLegacyWorkspaces(nextLocals, localDefaultWorkspaceId, userId);
      });
    } catch (err) {
      console.error('Failed to reload workspaces', err);
    }
  };

  useEffect(() => {
    let isMounted = true;
    api.get('/workspaces').then((res: any) => {
      if (!isMounted) return;
      const remoteWorkspaces = (res.data || []).filter((remote: any) => !deletedWorkspaceIdsRef.current.has(remote.id));
      const remoteIds = new Set<string>(remoteWorkspaces.map((remote: any) => remote.id));
      console.log('[SYNC] Fetched remote workspaces:', remoteWorkspaces.map((w: any) => ({ id: w.id, name: w.name })));

      setWorkspaces((prevLocals) => {
        let hasChanges = false;
        const nextLocals = [...removeUnavailableRemoteWorkspaces(prevLocals, remoteIds)];
        if (nextLocals.length !== prevLocals.length) {
          console.log('[SYNC] Removed unavailable locals:', prevLocals.filter(p => !nextLocals.some(n => n.id === p.id)).map(w => w.id));
          hasChanges = true;
        }

        for (const remote of remoteWorkspaces) {
          if (shouldSkipLegacyDefaultRemote(remote, nextLocals, localDefaultWorkspaceId, userId)) continue;
          hasChanges = mergeInitialRemoteWorkspace(remote, nextLocals, hasChanges, args);
        }

        if (hasChanges) return normalizeLegacyWorkspaces(nextLocals, localDefaultWorkspaceId, userId);
        const normalizedLocals = normalizeLegacyWorkspaces(prevLocals, localDefaultWorkspaceId, userId);
        return normalizedLocals.length !== prevLocals.length ? normalizedLocals : prevLocals;
      });
    }).catch((err: any) => {
      console.error('Failed to fetch workspaces from backend', err);
    });

    return () => { isMounted = false; };
  }, [setWorkspaces]);

  useEffect(() => {
    if (workspaces.length === 0) return;
    const timeoutId = setTimeout(() => {
      workspaces.forEach((workspace) => {
        if (deletedWorkspaceIdsRef.current.has(workspace.id)) return;
        if (!canSyncWorkspace(workspace, userId)) return;

        const dataPayload = getWorkspaceSyncPayload(workspace);
        const signature = getSyncSignature(dataPayload);
        const lastSyncedSignature = lastSyncedSignaturesRef.current[workspace.id];
        const shouldSync = dirtyWorkspaceIdsRef.current.has(workspace.id) || signature !== lastSyncedSignature;
        if (!shouldSync || syncingWorkspaceIdsRef.current.has(workspace.id)) return;

        syncingWorkspaceIdsRef.current.add(workspace.id);
        api.put(`/workspaces/${workspace.id}/sync`, dataPayload)
          .then(() => {
            lastSyncedSignaturesRef.current[workspace.id] = signature;
            dirtyWorkspaceIdsRef.current.delete(workspace.id);
          })
          .catch((err: any) => {
            dirtyWorkspaceIdsRef.current.add(workspace.id);
            console.error('Failed to sync workspace to backend', workspace.id, err);
          })
          .finally(() => {
            syncingWorkspaceIdsRef.current.delete(workspace.id);
          });
      });
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [workspaces, activeWorkspaceId, userId]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      api.get('/workspaces').then((res: any) => {
        const remoteWorkspaces = (res.data || []).filter((remote: any) => !deletedWorkspaceIdsRef.current.has(remote.id));
        const remoteIds = new Set<string>(remoteWorkspaces.map((remote: any) => remote.id));

        setWorkspaces((prevLocals) => {
          let hasChanges = false;
          const nextLocals = [...removeUnavailableRemoteWorkspaces(prevLocals, remoteIds)];
          if (nextLocals.length !== prevLocals.length) hasChanges = true;

          for (const remote of remoteWorkspaces) {
            hasChanges = mergePolledRemoteWorkspace(remote, nextLocals, hasChanges, args);
          }

          return hasChanges ? normalizeLegacyWorkspaces(nextLocals, localDefaultWorkspaceId, userId) : prevLocals;
        });
      }).catch((err: any) => {
        console.error('Failed to refresh shared workspaces', err);
      });
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, [setWorkspaces, userId]);

  return { reloadWorkspaces };
}

function mergeInitialRemoteWorkspace(remote: any, nextLocals: Workspace[], hasChanges: boolean, args: WorkspaceSyncArgs) {
  const { dirtyWorkspaceIdsRef, lastSyncedSignaturesRef, syncingWorkspaceIdsRef, userId } = args;
  const localIndex = nextLocals.findIndex(w => w.id === remote.id);
  const remoteSignature = getSyncSignature(getRemoteSyncPayload(remote));

  if (localIndex === -1) {
    console.log('[SYNC] Adding missing remote workspace:', remote.id);
    nextLocals.push(mapRemoteWorkspace(remote));
    lastSyncedSignaturesRef.current[remote.id] = remoteSignature;
    return true;
  }

  const local = nextLocals[localIndex];
  const remoteWorkspace = mapRemoteWorkspace(remote, local);
  const member = remote.members?.find((m: any) => m.userId === userId);
  const isViewer = member?.role === 'VIEWER';
  const localSignature = getSyncSignature(getWorkspaceSyncPayload(local));
  const hasPendingLocalChanges = dirtyWorkspaceIdsRef.current.has(remote.id) || syncingWorkspaceIdsRef.current.has(remote.id);

  if (isViewer && remote.ownerId !== userId) {
    lastSyncedSignaturesRef.current[remote.id] = remoteSignature;
    if (JSON.stringify(local) !== JSON.stringify(remoteWorkspace)) {
      nextLocals[localIndex] = remoteWorkspace;
      return true;
    }
    return hasChanges;
  }

  if (hasPendingLocalChanges) {
    nextLocals[localIndex] = { ...local, ownerId: remote.ownerId, members: remote.members || [] };
    return true;
  }

  if (localSignature !== remoteSignature) {
    console.log('[SYNC] Signature mismatch for', local.id, 'pulling remote workspace.');
    nextLocals[localIndex] = remoteWorkspace;
    lastSyncedSignaturesRef.current[remote.id] = remoteSignature;
    return true;
  }

  lastSyncedSignaturesRef.current[remote.id] = remoteSignature;

  if (JSON.stringify(local.members || []) !== JSON.stringify(remote.members || [])) {
    console.log('[SYNC] Members mismatch for', local.id, 'updating locally.');
    nextLocals[localIndex] = { ...local, ownerId: remote.ownerId, members: remote.members || [] };
    return true;
  }

  return hasChanges;
}

function mergePolledRemoteWorkspace(remote: any, nextLocals: Workspace[], hasChanges: boolean, args: WorkspaceSyncArgs) {
  const { dirtyWorkspaceIdsRef, lastSyncedSignaturesRef, syncingWorkspaceIdsRef, userId } = args;
  const localIndex = nextLocals.findIndex((workspace) => workspace.id === remote.id);
  const remoteWorkspace = mapRemoteWorkspace(remote, localIndex !== -1 ? nextLocals[localIndex] : undefined);
  const remoteSignature = getSyncSignature(getRemoteSyncPayload(remote));

  if (localIndex === -1) {
    nextLocals.push(remoteWorkspace);
    lastSyncedSignaturesRef.current[remote.id] = remoteSignature;
    return true;
  }

  const local = nextLocals[localIndex];
  const localSignature = getSyncSignature(getWorkspaceSyncPayload(local));
  const lastSyncedSignature = lastSyncedSignaturesRef.current[remote.id];
  const hasPendingLocalChanges = dirtyWorkspaceIdsRef.current.has(remote.id) || syncingWorkspaceIdsRef.current.has(remote.id);
  const member = remote.members?.find((m: any) => m.userId === userId);
  const isViewer = member?.role === 'VIEWER';

  if (isViewer && remote.ownerId !== userId) {
    nextLocals[localIndex] = remoteWorkspace;
    lastSyncedSignaturesRef.current[remote.id] = remoteSignature;
    return true;
  }

  if (hasPendingLocalChanges) {
    nextLocals[localIndex] = { ...local, ownerId: remote.ownerId, members: remote.members || [] };
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

  if (JSON.stringify(local.members || []) !== JSON.stringify(remote.members || [])) {
    nextLocals[localIndex] = { ...local, ownerId: remote.ownerId, members: remote.members || [] };
    return true;
  }

  return hasChanges;
}
