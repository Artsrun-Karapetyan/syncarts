import type { Collection, Folder as IFolder, SavedRequest } from '../../../contexts/WorkspaceContext';

export function countItems(items: (IFolder | SavedRequest)[]): number {
  return items.reduce((acc, item) => {
    if (item.type === 'folder') return acc + countItems(item.items);
    return acc + 1;
  }, 0);
}

export function findFolder(items: (IFolder | SavedRequest)[], folderId: string): IFolder | undefined {
  for (const item of items) {
    if (item.type === 'folder' && item.id === folderId) return item;
    if (item.type === 'folder') {
      const found = findFolder(item.items, folderId);
      if (found) return found;
    }
  }
  return undefined;
}

export function findRequest(items: (IFolder | SavedRequest)[], requestId: string): SavedRequest | undefined {
  for (const item of items) {
    if (item.type === 'request' && item.id === requestId) return item;
    if (item.type === 'folder') {
      const found = findRequest(item.items, requestId);
      if (found) return found;
    }
  }
  return undefined;
}

export function findRequestPath(collections: Collection[], savedRequestId: string) {
  for (const collection of collections) {
    const walk = (items: (IFolder | SavedRequest)[], folderIds: string[]): string[] | null => {
      for (const item of items) {
        if (item.type === 'request' && item.id === savedRequestId) return folderIds;
        if (item.type === 'folder') {
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

export function filterCollections(collections: Collection[], query: string): Collection[] {
  if (!query) return collections;

  const lowerQuery = query.toLowerCase();
  const filterItems = (items: (IFolder | SavedRequest)[]): (IFolder | SavedRequest)[] =>
    items
      .map((item) => {
        if (item.name.toLowerCase().includes(lowerQuery)) return item;
        if (item.type === 'folder') {
          const filteredChildren = filterItems(item.items);
          if (filteredChildren.length > 0) return { ...item, items: filteredChildren };
        }
        return null;
      })
      .filter(Boolean) as (IFolder | SavedRequest)[];

  return collections
    .map((collection) => {
      if (collection.name.toLowerCase().includes(lowerQuery)) return collection;

      const matchedItems = filterItems(collection.items || []);
      if (matchedItems.length > 0) return { ...collection, items: matchedItems };
      return null;
    })
    .filter(Boolean) as Collection[];
}

export function renameMatchingItem(
  collections: Collection[],
  targetId: string,
  newName: string,
  renameItem: (collectionId: string, itemId: string, name: string) => void
) {
  for (const collection of collections) {
    if (collection.id === targetId) {
      renameItem(collection.id, targetId, newName);
      return;
    }

    const found = walkRenameTargets(collection.items, targetId);
    if (found) {
      renameItem(collection.id, targetId, newName);
      return;
    }
  }
}

function walkRenameTargets(items: (IFolder | SavedRequest)[], targetId: string): boolean {
  for (const item of items) {
    if (item.id === targetId) return true;
    if (item.type === 'request' && item.examples?.some((example) => example.id === targetId)) return true;
    if (item.type === 'folder' && walkRenameTargets(item.items, targetId)) return true;
  }

  return false;
}
