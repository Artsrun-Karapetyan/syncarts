import type {
  Collection,
  Folder,
  SavedRequest,
} from "../../../contexts/WorkspaceContext";

export interface HealthRequestLocation {
  folderId: string | null;
  folderPath: string;
  request: SavedRequest;
}

export function getCollectionHealthRequestLocations(collection: Collection) {
  const locations = flattenRequestLocations(collection.items, null, []);
  return new Map(
    locations.map((location) => [location.request.id, location] as const),
  );
}

function flattenRequestLocations(
  items: Array<Folder | SavedRequest>,
  folderId: string | null,
  folderPath: string[],
): HealthRequestLocation[] {
  return items.flatMap((item) => {
    if (item.type === "request") {
      return [{ folderId, folderPath: folderPath.join(" / "), request: item }];
    }

    return flattenRequestLocations(item.items, item.id, [
      ...folderPath,
      item.name,
    ]);
  });
}
