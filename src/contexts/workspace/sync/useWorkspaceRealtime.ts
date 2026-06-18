import { useEffect, useRef } from "react";

import { api } from "../../../lib/api";
import type { SavedRequest, Workspace } from "../core/types";
import {
  createWorkspaceEventSource,
  replaceRealtimeRequest,
  type WorkspaceRealtimeEvent,
} from "./workspaceRealtimeHelpers";

type SetWorkspaces = (
  value: Workspace[] | ((prev: Workspace[]) => Workspace[]),
) => void;

interface WorkspaceRealtimeArgs {
  activeWorkspaceId: string;
  dirtyWorkspaceIdsRef: React.MutableRefObject<Set<string>>;
  reloadWorkspaces: () => Promise<void>;
  setWorkspaces: SetWorkspaces;
  storageHydrated: boolean;
  syncingWorkspaceIdsRef: React.MutableRefObject<Set<string>>;
  workspacesRef: React.MutableRefObject<Workspace[]>;
}

export function useWorkspaceRealtime(args: WorkspaceRealtimeArgs) {
  const {
    activeWorkspaceId,
    dirtyWorkspaceIdsRef,
    setWorkspaces,
    storageHydrated,
    syncingWorkspaceIdsRef,
    workspacesRef,
  } = args;
  const reloadRef = useRef(args.reloadWorkspaces);

  useEffect(() => {
    reloadRef.current = args.reloadWorkspaces;
  }, [args.reloadWorkspaces]);

  useEffect(() => {
    if (!storageHydrated || !activeWorkspaceId) return;

    const workspace = workspacesRef.current.find(
      (item) => item.id === activeWorkspaceId,
    );
    if (!workspace?.ownerId) return;

    const eventSource = createWorkspaceEventSource(activeWorkspaceId);
    if (!eventSource) return;

    const onRequestUpdated = (message: MessageEvent<string>) => {
      const event = parseWorkspaceEvent(message.data);
      if (!event?.entityId) return;
      if (hasPendingLocalChanges(event.workspaceId)) return;

      void api
        .get<SavedRequest>(
          `/workspaces/${event.workspaceId}/requests/${event.entityId}`,
        )
        .then((response) => {
          let shouldReload = false;
          setWorkspaces((prev) => {
            const result = replaceRealtimeRequest(
              prev,
              event.workspaceId,
              response.data,
              event,
            );
            shouldReload = result.needsReload;
            return result.changed ? result.workspaces : prev;
          });
          if (shouldReload) void reloadRef.current();
        })
        .catch(() => {
          void reloadRef.current();
        });
    };

    const onWorkspaceUpdated = (message: MessageEvent<string>) => {
      const event = parseWorkspaceEvent(message.data);
      if (!event || hasPendingLocalChanges(event.workspaceId)) return;
      void reloadRef.current();
    };

    const onWorkspaceDeleted = (message: MessageEvent<string>) => {
      const event = parseWorkspaceEvent(message.data);
      if (!event) return;
      void reloadRef.current();
    };

    eventSource.addEventListener("request.updated", onRequestUpdated);
    eventSource.addEventListener("workspace.updated", onWorkspaceUpdated);
    eventSource.addEventListener("workspace.deleted", onWorkspaceDeleted);

    return () => {
      eventSource.removeEventListener("request.updated", onRequestUpdated);
      eventSource.removeEventListener("workspace.updated", onWorkspaceUpdated);
      eventSource.removeEventListener("workspace.deleted", onWorkspaceDeleted);
      eventSource.close();
    };
  }, [activeWorkspaceId, storageHydrated, setWorkspaces, workspacesRef]);

  function hasPendingLocalChanges(workspaceId: string) {
    return (
      dirtyWorkspaceIdsRef.current.has(workspaceId) ||
      syncingWorkspaceIdsRef.current.has(workspaceId)
    );
  }
}

function parseWorkspaceEvent(value: string) {
  try {
    return JSON.parse(value) as WorkspaceRealtimeEvent;
  } catch {
    return null;
  }
}
