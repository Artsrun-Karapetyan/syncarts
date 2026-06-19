import type { WatchEntityType, WorkspaceWatch } from "./watchTypes";

export function watchKey(entityType: WatchEntityType, entityId: string) {
  return `${entityType}:${entityId}`;
}

export function buildWatchMap(watches: WorkspaceWatch[]) {
  return new Set(
    watches.map((watch) => watchKey(watch.entityType, watch.entityId)),
  );
}

export function isEntityWatched(
  watchMap: Set<string>,
  entityType: WatchEntityType,
  entityId: string,
) {
  return watchMap.has(watchKey(entityType, entityId));
}
