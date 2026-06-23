import { invoke } from "@tauri-apps/api/core";
import { listen, UnlistenFn } from "@tauri-apps/api/event";
import { useEffect, useRef } from "react";

import type { Workspace } from "@/contexts/workspace/core/types";
import {
  readWorkspaceFromLocalFs,
  writeWorkspaceToLocalFs,
} from "@/contexts/workspace/sync/localFsSyncHelpers";

type SetWorkspaces = (
  value: Workspace[] | ((prev: Workspace[]) => Workspace[]),
) => void;

interface LocalWorkspaceSyncArgs {
  activeWorkspaceId: string;
  deletedWorkspaceIdsRef: React.MutableRefObject<Set<string>>;
  dirtyWorkspaceIdsRef: React.MutableRefObject<Set<string>>;
  setWorkspaces: SetWorkspaces;
  storageHydrated: boolean;
  workspaces: Workspace[];
}

export function useLocalWorkspaceSync({
  activeWorkspaceId,
  deletedWorkspaceIdsRef,
  dirtyWorkspaceIdsRef,
  setWorkspaces,
  storageHydrated,
  workspaces,
}: LocalWorkspaceSyncArgs) {
  const workspacesRef = useRef(workspaces);
  const isSyncingRef = useRef(false);

  useEffect(() => {
    workspacesRef.current = workspaces;
  }, [workspaces]);

  // Load local workspaces on mount and when active workspace changes
  useEffect(() => {
    if (!storageHydrated) return;

    const currentWorkspace = workspacesRef.current.find(
      (w) => w.id === activeWorkspaceId,
    );
    if (
      !currentWorkspace ||
      currentWorkspace.type !== "local" ||
      !currentWorkspace.path
    )
      return;

    let unlisten: UnlistenFn | undefined;

    const initLocalSync = async () => {
      try {
        // Read latest state from FS
        const fsWorkspace = await readWorkspaceFromLocalFs(
          currentWorkspace.path!,
        );
        setWorkspaces((prev) =>
          prev.map((w) => {
            if (w.id === activeWorkspaceId) {
              return fsWorkspace
                ? { ...fsWorkspace, id: activeWorkspaceId }
                : {
                    ...w,
                    collections: [],
                    environments: [],
                    globalVariables: [],
                  };
            }
            return w;
          }),
        );

        // Start watching for FS changes (from Git pull, etc)
        await invoke("watch_local_workspace", { path: currentWorkspace.path });

        let debounceTimer: ReturnType<typeof setTimeout> | null = null;

        unlisten = await listen("fs_event", async (event: any) => {
          const payload = event.payload as {
            workspace: string;
            kind: string;
            paths: string[];
          };
          if (payload.workspace === currentWorkspace.path) {
            if (isSyncingRef.current) return; // ignore our own writes

            if (debounceTimer) clearTimeout(debounceTimer);
            debounceTimer = setTimeout(async () => {
              // Reload workspace from FS
              const updatedFsWorkspace = await readWorkspaceFromLocalFs(
                currentWorkspace.path!,
              );
              setWorkspaces((prev) =>
                prev.map((w) => {
                  if (w.id === activeWorkspaceId) {
                    return updatedFsWorkspace
                      ? { ...updatedFsWorkspace, id: activeWorkspaceId }
                      : {
                          ...w,
                          collections: [],
                          environments: [],
                          globalVariables: [],
                        };
                  }
                  return w;
                }),
              );
            }, 300);
          }
        });
      } catch (err) {
        console.error("Failed to init local workspace sync", err);
      }
    };

    void initLocalSync();

    return () => {
      if (unlisten) unlisten();
      invoke("unwatch_local_workspace", { path: currentWorkspace.path }).catch(
        console.error,
      );
    };
  }, [activeWorkspaceId, storageHydrated, setWorkspaces]);

  // Write changes to FS when dirty
  useEffect(() => {
    if (!storageHydrated || workspaces.length === 0) return;

    const timeoutId = setTimeout(() => {
      workspaces.forEach((workspace) => {
        if (deletedWorkspaceIdsRef.current.has(workspace.id)) return;
        if (workspace.type !== "local" || !workspace.path) return;

        const shouldSync = dirtyWorkspaceIdsRef.current.has(workspace.id);
        if (!shouldSync || isSyncingRef.current) return;

        isSyncingRef.current = true;
        dirtyWorkspaceIdsRef.current.delete(workspace.id);

        writeWorkspaceToLocalFs(workspace)
          .catch((err) => {
            dirtyWorkspaceIdsRef.current.add(workspace.id);
            console.error(
              "Failed to sync workspace to local fs",
              workspace.id,
              err,
            );
          })
          .finally(() => {
            // Small debounce to ignore the immediate FS watch events caused by our own writes
            setTimeout(() => {
              isSyncingRef.current = false;
            }, 500);
          });
      });
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [workspaces, storageHydrated]);
}
