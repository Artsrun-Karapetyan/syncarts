import type {
  Collection,
  Folder,
  SavedRequest,
  TabData,
} from "../../../contexts/WorkspaceContext";
import type { CollectionRunItem } from "./collectionRunTypes";

export function getCollectionRunItems(
  collection: Collection,
  targetFolderId?: string,
) {
  if (targetFolderId) {
    const found = findFolderWithPath(collection.items, targetFolderId, []);
    if (found) {
      return flattenRunItems(
        collection.id,
        found.folder.items,
        found.folder.id,
        found.path,
      );
    }
  }
  return flattenRunItems(collection.id, collection.items, null, []);
}

function findFolderWithPath(
  items: Array<Folder | SavedRequest>,
  folderId: string,
  currentPath: string[],
): { folder: Folder; path: string[] } | null {
  for (const item of items) {
    if (item.type === "folder") {
      if (item.id === folderId) {
        return { folder: item, path: [...currentPath, item.name] };
      }
      const found = findFolderWithPath(item.items, folderId, [
        ...currentPath,
        item.name,
      ]);
      if (found) return found;
    }
  }
  return null;
}

function flattenRunItems(
  collectionId: string,
  items: Array<Folder | SavedRequest>,
  folderId: string | null,
  folderPath: string[],
): CollectionRunItem[] {
  return items.flatMap((item) => {
    if (item.type === "request") {
      return [createRunItem(collectionId, folderId, folderPath, item)];
    }

    return flattenRunItems(collectionId, item.items, item.id, [
      ...folderPath,
      item.name,
    ]);
  });
}

function createRunItem(
  collectionId: string,
  folderId: string | null,
  folderPath: string[],
  request: SavedRequest,
): CollectionRunItem {
  return {
    folderId,
    folderPath: folderPath.join(" / "),
    request,
    tab: createRequestTab(collectionId, folderId, request),
  };
}

function createRequestTab(
  collectionId: string,
  folderId: string | null,
  request: SavedRequest,
): TabData {
  return {
    ...request,
    id: crypto.randomUUID(),
    collectionId,
    folderId: folderId || undefined,
    response: null,
    savedRequestId: request.id,
  };
}
