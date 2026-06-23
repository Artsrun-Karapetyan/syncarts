import { useCallback, useEffect, useMemo, useState } from "react";

import {
  fetchWorkspaceWatches,
  setWorkspaceWatch,
} from "@/components/watch/watchApi";
import { buildWatchMap, watchKey } from "@/components/watch/watchHelpers";
import type {
  WatchEntityType,
  WorkspaceWatch,
} from "@/components/watch/watchTypes";
import { getAuthToken } from "@/lib/auth";

export function useWorkspaceWatches(workspaceId?: string | null) {
  const [watches, setWatches] = useState<WorkspaceWatch[]>([]);

  const refresh = useCallback(async () => {
    if (!workspaceId || !getAuthToken()) {
      setWatches([]);
      return;
    }
    setWatches(await fetchWorkspaceWatches(workspaceId));
  }, [workspaceId]);

  useEffect(() => {
    void refresh().catch((error) => {
      console.error("Failed to fetch watches", error);
    });
  }, [refresh]);

  const watchMap = useMemo(() => buildWatchMap(watches), [watches]);

  const isWatched = useCallback(
    (entityType: WatchEntityType, entityId: string) =>
      watchMap.has(watchKey(entityType, entityId)),
    [watchMap],
  );

  const toggleWatch = useCallback(
    async (entityType: WatchEntityType, entityId: string) => {
      if (!workspaceId) return false;
      const enabled = !isWatched(entityType, entityId);
      const previous = watches;

      setWatches((current) =>
        enabled
          ? [
              ...current,
              {
                id: watchKey(entityType, entityId),
                userId: "",
                workspaceId,
                entityType,
                entityId,
                createdAt: new Date().toISOString(),
              },
            ]
          : current.filter(
              (watch) =>
                watchKey(watch.entityType, watch.entityId) !==
                watchKey(entityType, entityId),
            ),
      );

      try {
        await setWorkspaceWatch({ workspaceId, entityType, entityId, enabled });
        return enabled;
      } catch (error) {
        setWatches(previous);
        throw error;
      }
    },
    [isWatched, watches, workspaceId],
  );

  return { isWatched, refresh, toggleWatch, watchMap, watches };
}
