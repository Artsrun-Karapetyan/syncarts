import { useEffect, useRef } from "react";

import { api } from "../../../lib/api";
import type { Workspace } from "../core/types";
import { hydrateRemoteWorkspaceDetails } from "./remoteWorkspaceDetails";
import {
  canSyncWorkspace,
  getSyncSignature,
  getWorkspaceSyncPayload,
  mapRemoteWorkspace,
  normalizeLegacyWorkspaces,
  shouldSkipLegacyDefaultRemote,
} from "./syncHelpers";
import { useWorkspaceRealtime } from "./useWorkspaceRealtime";
import {
  mergeInitialRemoteWorkspace,
  mergePolledRemoteWorkspace,
  removeUnavailableRemoteWorkspaces,
} from "./workspaceSyncMergeHelpers";

type SetWorkspaces = (
  value: Workspace[] | ((prev: Workspace[]) => Workspace[]),
) => void;

interface WorkspaceSyncArgs {
  activeWorkspaceId: string;
  deletedWorkspaceIdsRef: React.MutableRefObject<Set<string>>;
  dirtyWorkspaceIdsRef: React.MutableRefObject<Set<string>>;
  lastSyncedSignaturesRef: React.MutableRefObject<Record<string, string>>;
  localDefaultWorkspaceId: string;
  setWorkspaces: SetWorkspaces;
  storageHydrated: boolean;
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
    storageHydrated,
    syncingWorkspaceIdsRef,
    userId,
    workspaces,
  } = args;
  const workspacesRef = useRef(workspaces);

  useEffect(() => {
    workspacesRef.current = workspaces;
  }, [workspaces]);

  const reloadWorkspaces = async () => {
    try {
      const res: any = await api.get("/workspaces");
      const remoteWorkspaces = (res.data || []).filter(
        (remote: any) => !deletedWorkspaceIdsRef.current.has(remote.id),
      );
      const hydratedRemotes = await hydrateRemoteWorkspaceDetails(
        remoteWorkspaces,
        workspacesRef.current,
        args,
      );
      const remoteIds = new Set<string>(
        hydratedRemotes.map((remote: any) => remote.id),
      );

      setWorkspaces((prevLocals) => {
        const nextLocals = [
          ...removeUnavailableRemoteWorkspaces(prevLocals, remoteIds, args),
        ];
        for (const remote of hydratedRemotes) {
          if (
            shouldSkipLegacyDefaultRemote(
              remote,
              nextLocals,
              localDefaultWorkspaceId,
              userId,
            )
          )
            continue;
          const remoteData = remote.data || {
            collections: [],
            environments: [],
          };
          const localIndex = nextLocals.findIndex(
            (workspace) => workspace.id === remote.id,
          );

          if (localIndex === -1) {
            nextLocals.push({
              ...mapRemoteWorkspace(remote),
              collections: remoteData.collections || [],
              environments: remoteData.environments || [],
            });
            continue;
          }
          nextLocals[localIndex] = mapRemoteWorkspace(
            remote,
            nextLocals[localIndex],
          );
        }

        return normalizeLegacyWorkspaces(
          nextLocals,
          localDefaultWorkspaceId,
          userId,
        );
      });
    } catch (err) {
      console.error("Failed to reload workspaces", err);
    }
  };

  useWorkspaceRealtime({
    activeWorkspaceId,
    dirtyWorkspaceIdsRef,
    reloadWorkspaces,
    setWorkspaces,
    storageHydrated,
    syncingWorkspaceIdsRef,
    workspacesRef,
  });

  useEffect(() => {
    if (!storageHydrated) return;

    let isMounted = true;
    api
      .get("/workspaces")
      .then(async (res: any) => {
        if (!isMounted) return;
        const remoteWorkspaces = (res.data || []).filter(
          (remote: any) => !deletedWorkspaceIdsRef.current.has(remote.id),
        );
        const hydratedRemotes = await hydrateRemoteWorkspaceDetails(
          remoteWorkspaces,
          workspacesRef.current,
          args,
        );
        if (!isMounted) return;
        const remoteIds = new Set<string>(
          hydratedRemotes.map((remote: any) => remote.id),
        );
        setWorkspaces((prevLocals) => {
          let hasChanges = false;
          const nextLocals = [
            ...removeUnavailableRemoteWorkspaces(prevLocals, remoteIds, args),
          ];
          if (nextLocals.length !== prevLocals.length) {
            hasChanges = true;
          }

          for (const remote of hydratedRemotes) {
            if (
              shouldSkipLegacyDefaultRemote(
                remote,
                nextLocals,
                localDefaultWorkspaceId,
                userId,
              )
            )
              continue;
            hasChanges = mergeInitialRemoteWorkspace(
              remote,
              nextLocals,
              hasChanges,
              args,
            );
          }

          if (hasChanges)
            return normalizeLegacyWorkspaces(
              nextLocals,
              localDefaultWorkspaceId,
              userId,
            );
          const normalizedLocals = normalizeLegacyWorkspaces(
            prevLocals,
            localDefaultWorkspaceId,
            userId,
          );
          return normalizedLocals.length !== prevLocals.length
            ? normalizedLocals
            : prevLocals;
        });
      })
      .catch((err: any) => {
        console.error("Failed to fetch workspaces from backend", err);
      });

    return () => {
      isMounted = false;
    };
  }, [setWorkspaces, storageHydrated]);

  useEffect(() => {
    if (!storageHydrated) return;
    if (workspaces.length === 0) return;

    const timeoutId = setTimeout(() => {
      workspaces.forEach((workspace) => {
        if (deletedWorkspaceIdsRef.current.has(workspace.id)) return;
        if (!canSyncWorkspace(workspace, userId)) return;

        const dataPayload = getWorkspaceSyncPayload(workspace);
        const signature = getSyncSignature(dataPayload);
        const shouldSync = dirtyWorkspaceIdsRef.current.has(workspace.id);
        if (!shouldSync || syncingWorkspaceIdsRef.current.has(workspace.id))
          return;

        syncingWorkspaceIdsRef.current.add(workspace.id);
        api
          .put(`/workspaces/${workspace.id}/sync`, {
            ...dataPayload,
            version: workspace.version,
          })
          .then((res: any) => {
            const remote = res.data;
            lastSyncedSignaturesRef.current[workspace.id] = signature;
            dirtyWorkspaceIdsRef.current.delete(workspace.id);
            if (!remote) return;
            setWorkspaces((prevLocals) =>
              prevLocals.map((local) =>
                local.id === workspace.id
                  ? {
                      ...local,
                      ownerId: remote.ownerId ?? local.ownerId,
                      members: remote.members || local.members,
                      version: remote.version ?? local.version,
                      updatedAt: remote.updatedAt || local.updatedAt,
                    }
                  : local,
              ),
            );
          })
          .catch((err: any) => {
            dirtyWorkspaceIdsRef.current.add(workspace.id);
            console.error(
              "Failed to sync workspace to backend",
              workspace.id,
              err,
            );
          })
          .finally(() => {
            syncingWorkspaceIdsRef.current.delete(workspace.id);
          });
      });
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [workspaces, activeWorkspaceId, storageHydrated, userId]);

  useEffect(() => {
    if (!storageHydrated) return;

    const intervalId = window.setInterval(() => {
      api
        .get("/workspaces")
        .then(async (res: any) => {
          const remoteWorkspaces = (res.data || []).filter(
            (remote: any) => !deletedWorkspaceIdsRef.current.has(remote.id),
          );
          const hydratedRemotes = await hydrateRemoteWorkspaceDetails(
            remoteWorkspaces,
            workspacesRef.current,
            args,
          );
          const remoteIds = new Set<string>(
            hydratedRemotes.map((remote: any) => remote.id),
          );

          setWorkspaces((prevLocals) => {
            let hasChanges = false;
            const nextLocals = [
              ...removeUnavailableRemoteWorkspaces(prevLocals, remoteIds, args),
            ];
            if (nextLocals.length !== prevLocals.length) hasChanges = true;

            for (const remote of hydratedRemotes) {
              hasChanges = mergePolledRemoteWorkspace(
                remote,
                nextLocals,
                hasChanges,
                args,
              );
            }

            return hasChanges
              ? normalizeLegacyWorkspaces(
                  nextLocals,
                  localDefaultWorkspaceId,
                  userId,
                )
              : prevLocals;
          });
        })
        .catch((err: any) => {
          console.error("Failed to refresh shared workspaces", err);
        });
    }, 30000);

    return () => window.clearInterval(intervalId);
  }, [setWorkspaces, storageHydrated, userId]);

  return { reloadWorkspaces };
}
