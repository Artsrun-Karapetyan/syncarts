import type {
  Collection,
  Folder as IFolder,
  SavedRequest,
} from "../../../contexts/WorkspaceContext";
import { walkRenameTargets } from "./walkRenameTargets";

export function countItems(items: (IFolder | SavedRequest)[]): number {
  return items.reduce((acc, item) => {
    if (item.type === "folder") return acc + countItems(item.items);
    return acc + 1;
  }, 0);
}

export function findFolder(
  items: (IFolder | SavedRequest)[],
  folderId: string,
): IFolder | undefined {
  for (const item of items) {
    if (item.type === "folder" && item.id === folderId) return item;
    if (item.type === "folder") {
      const found = findFolder(item.items, folderId);
      if (found) return found;
    }
  }
  return undefined;
}

export function findRequest(
  items: (IFolder | SavedRequest)[],
  requestId: string,
): SavedRequest | undefined {
  for (const item of items) {
    if (item.type === "request" && item.id === requestId) return item;
    if (item.type === "folder") {
      const found = findRequest(item.items, requestId);
      if (found) return found;
    }
  }
  return undefined;
}

export function findRequestPath(
  collections: Collection[],
  savedRequestId: string,
) {
  for (const collection of collections) {
    const walk = (
      items: (IFolder | SavedRequest)[],
      folderIds: string[],
    ): string[] | null => {
      for (const item of items) {
        if (item.type === "request" && item.id === savedRequestId)
          return folderIds;
        if (item.type === "folder") {
          const found = walk(item.items, [...folderIds, item.id]);
          if (found) return found;
        }
      }
      return null;
    };

    const folderIds = walk(collection.items, []);
    if (folderIds) return { collectionId: collection.id, folderIds };
  }

  return null;
}

export function findExamplePath(collections: Collection[], exampleId: string) {
  for (const collection of collections) {
    const walk = (
      items: (IFolder | SavedRequest)[],
      folderIds: string[],
    ): { folderIds: string[]; requestId: string } | null => {
      for (const item of items) {
        if (
          item.type === "request" &&
          item.examples?.some((example) => example.id === exampleId)
        )
          return { folderIds, requestId: item.id };

        if (item.type === "folder") {
          const found = walk(item.items, [...folderIds, item.id]);
          if (found) return found;
        }
      }
      return null;
    };

    const found = walk(collection.items, []);
    if (found)
      return {
        collectionId: collection.id,
        folderIds: found.folderIds,
        requestId: found.requestId,
      };
  }

  return null;
}

export function filterCollections(
  collections: Collection[],
  query: string,
): Collection[] {
  if (!query) return collections;

  const lowerQuery = query.toLowerCase();
  const filterItems = (
    items: (IFolder | SavedRequest)[],
  ): (IFolder | SavedRequest)[] =>
    items
      .map((item) => {
        if (item.name.toLowerCase().includes(lowerQuery)) return item;
        if (item.type === "folder") {
          const filteredChildren = filterItems(item.items);
          if (filteredChildren.length > 0)
            return { ...item, items: filteredChildren };
        }
        return null;
      })
      .filter(Boolean) as (IFolder | SavedRequest)[];

  return collections
    .map((collection) => {
      if (collection.name.toLowerCase().includes(lowerQuery)) return collection;

      const matchedItems = filterItems(collection.items || []);
      if (matchedItems.length > 0)
        return { ...collection, items: matchedItems };
      return null;
    })
    .filter(Boolean) as Collection[];
}

interface RenameMatchingItemParams {
  collections: Collection[];
  targetId: string;
  newName: string;
  renameItem: (collectionId: string, itemId: string, name: string) => void;
}

export function renameMatchingItem(params: RenameMatchingItemParams) {
  for (const collection of params.collections) {
    if (collection.id === params.targetId) {
      params.renameItem(collection.id, params.targetId, params.newName);
      return;
    }

    const found = walkRenameTargets(collection.items, params.targetId);
    if (found) {
      params.renameItem(collection.id, params.targetId, params.newName);
      return;
    }
  }
}
