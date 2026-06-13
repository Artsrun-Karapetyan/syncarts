import type { Folder, SavedExample, SavedRequest } from "../core/types";

export function findFolder(
  items: (Folder | SavedRequest)[],
  folderId: string,
): Folder | null {
  for (const item of items) {
    if (item.type === "folder") {
      if (item.id === folderId) return item;
      const found = findFolder(item.items, folderId);
      if (found) return found;
    }
  }
  return null;
}

export function findExample(
  items: (Folder | SavedRequest)[],
  exampleId: string,
): SavedExample | null {
  for (const item of items) {
    if (item.type === "folder") {
      const found = findExample(item.items, exampleId);
      if (found) return found;
    } else if (item.examples) {
      const found = item.examples.find((example) => example.id === exampleId);
      if (found) return found;
    }
  }
  return null;
}
